import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
import os
import tempfile
import librosa

# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


class ProctoringService:
    def __init__(self):
        # Initialize MediaPipe with higher confidence for better accuracy
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_face_detection = mp.solutions.face_detection
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 1 = full-range model (better for varying distances)
            min_detection_confidence=0.6
        )

        # Initialize YOLO for object detection (using 'small' model for better accuracy)
        try:
            # yolov8s.pt is more accurate than yolov8n.pt (small vs nano)
            self.yolo_model = YOLO('yolov8s.pt')
        except:
            self.yolo_model = None
            print("YOLO model not loaded. Phone detection disabled.")

        # Eye gaze tracking landmarks
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]

    def analyze_frame(self, frame):
        """Analyze a video frame for proctoring violations"""
        violations = []
        analysis = {
            'face_detected': False,
            'face_count': 0,
            'looking_at_camera': True,
            'phone_detected': False,
            'emotion': 'neutral',
            'confidence_level': 70,
            'violations': []
        }

        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Face detection
        face_results = self.face_detection.process(rgb_frame)

        if face_results.detections:
            analysis['face_detected'] = True
            analysis['face_count'] = len(face_results.detections)

            if len(face_results.detections) > 1:
                violations.append({
                    'type': 'multiple_persons',
                    'severity': 'high',
                    'details': f'Detected {len(face_results.detections)} persons'
                })
        else:
            analysis['face_detected'] = False
            analysis['looking_at_camera'] = False  # Can't look at camera if no face
            violations.append({
                'type': 'face_not_visible',
                'severity': 'high',
                'details': 'No face detected in frame'
            })

        # Face mesh for gaze tracking
        mesh_results = self.face_mesh.process(rgb_frame)

        if mesh_results.multi_face_landmarks:
            for face_landmarks in mesh_results.multi_face_landmarks:
                # Check gaze direction
                gaze_direction = self._calculate_gaze(face_landmarks, frame.shape)

                if gaze_direction == 'away':
                    analysis['looking_at_camera'] = False
                    # Only add violation for sustained looking away (reduced severity)
                    violations.append({
                        'type': 'looking_away',
                        'severity': 'low',
                        'details': 'User may not be looking at the camera'
                    })
        else:
            # If no face mesh detected but face was detected, assume looking at camera
            if analysis['face_detected']:
                analysis['looking_at_camera'] = True

        # Phone detection using YOLO
        if self.yolo_model:
            phone_detected = self._detect_phone(frame)
            if phone_detected:
                analysis['phone_detected'] = True
                violations.append({
                    'type': 'phone_detected',
                    'severity': 'high',
                    'details': 'Mobile phone detected in frame'
                })

        analysis['violations'] = violations
        analysis['integrity_score'] = self._calculate_frame_integrity(violations)

        # Add emotion analysis if face is detected
        if analysis['face_detected']:
            try:
                emotion_data = self.analyze_emotion(frame)
                analysis['emotion'] = emotion_data.get('dominant_emotion', 'neutral')
                analysis['confidence_level'] = emotion_data.get('confidence_index', 70)
            except Exception as e:
                print(f"Emotion analysis error: {e}")
                analysis['emotion'] = 'neutral'
                analysis['confidence_level'] = 70

        return analysis

    def _calculate_gaze(self, face_landmarks, frame_shape):
        """Calculate gaze direction based on iris position"""
        h, w = frame_shape[:2]

        try:
            # Get iris centers
            left_iris = np.mean([[face_landmarks.landmark[i].x * w,
                                  face_landmarks.landmark[i].y * h]
                                 for i in self.LEFT_IRIS], axis=0)

            right_iris = np.mean([[face_landmarks.landmark[i].x * w,
                                   face_landmarks.landmark[i].y * h]
                                  for i in self.RIGHT_IRIS], axis=0)

            # Get eye corners
            left_eye_left = np.array([face_landmarks.landmark[self.LEFT_EYE[0]].x * w,
                                      face_landmarks.landmark[self.LEFT_EYE[0]].y * h])
            left_eye_right = np.array([face_landmarks.landmark[self.LEFT_EYE[3]].x * w,
                                       face_landmarks.landmark[self.LEFT_EYE[3]].y * h])

            # Calculate relative position
            eye_width = np.linalg.norm(left_eye_right - left_eye_left)
            iris_offset = np.linalg.norm(left_iris - left_eye_left)

            ratio = iris_offset / eye_width if eye_width > 0 else 0.5

            # Determine gaze direction (very lenient thresholds)
            if ratio < 0.15 or ratio > 0.85:
                return 'away'

            return 'center'

        except Exception as e:
            # Default to center (looking at camera) on any error
            return 'center'

    def _detect_phone(self, frame):
        """Detect mobile phone in frame using YOLO"""
        if not self.yolo_model:
            return False

        try:
            results = self.yolo_model(frame, verbose=False)

            for result in results:
                for box in result.boxes:
                    # Class 67 is 'cell phone' in COCO dataset
                    if int(box.cls) == 67:
                        confidence = float(box.conf)
                        if confidence > 0.4:  # Lower threshold for better detection
                            return True

            return False

        except Exception as e:
            return False

    def _calculate_frame_integrity(self, violations):
        """Calculate integrity score for a single frame"""
        if not violations:
            return 100

        severity_weights = {'low': 5, 'medium': 15, 'high': 30}
        total_penalty = sum(severity_weights.get(v['severity'], 10) for v in violations)

        return max(0, 100 - total_penalty)

    def analyze_emotion(self, frame):
        """Analyze facial emotions using DeepFace or FER"""
        try:
            from deepface import DeepFace

            result = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='opencv'  # Faster and more reliable
            )

            if isinstance(result, list):
                result = result[0]

            emotions = result.get('emotion', {})
            dominant = result.get('dominant_emotion', 'neutral')

            # Get the confidence for the dominant emotion
            dominant_confidence = emotions.get(dominant, 70)

            print(f"Emotion detected: {dominant} ({dominant_confidence:.1f}%)")

            # Map emotions to stress/confidence
            stress_emotions = ['fear', 'angry', 'sad']
            stress_level = sum(emotions.get(e, 0) for e in stress_emotions)

            return {
                'emotions': emotions,
                'dominant_emotion': dominant,
                'stress_level': min(100, stress_level),
                'confidence_index': round(dominant_confidence, 1)
            }

        except Exception as e:
            print(f"Emotion analysis failed: {e}")
            return {
                'emotions': {},
                'dominant_emotion': 'neutral',
                'stress_level': 30,
                'confidence_index': 70,
                'error': str(e)
            }

    def analyze_voice_stress(self, audio_file):
        """Analyze voice for stress indicators"""
        try:
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
                audio_file.save(temp.name)
                temp_path = temp.name

            # Load audio
            y, sr = librosa.load(temp_path, sr=None)

            # Extract features
            # Pitch variation (high variation = stress)
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)

            pitch_std = np.std(pitch_values) if pitch_values else 0

            # Speaking rate (words per minute estimation)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

            # Energy variation
            rms = librosa.feature.rms(y=y)[0]
            energy_std = np.std(rms)

            # Normalize to scores
            stress_level = min(100, pitch_std / 50 * 100)
            tone_stability = max(0, 100 - energy_std * 1000)

            # Confidence based on consistent tempo
            confidence = min(100, tempo / 2) if tempo < 200 else 50

            os.unlink(temp_path)

            return {
                'stress_level': round(stress_level, 2),
                'confidence_index': round(confidence, 2),
                'tone_stability': round(tone_stability, 2),
                'speaking_pace': 'normal' if 100 < tempo < 180 else ('fast' if tempo >= 180 else 'slow')
            }

        except Exception as e:
            return {
                'stress_level': 30,
                'confidence_index': 70,
                'tone_stability': 80,
                'speaking_pace': 'normal',
                'error': str(e)
            }

    def analyze_audio(self, audio_file):
        """Analyze audio for background noise"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
                audio_file.save(temp.name)
                temp_path = temp.name

            y, sr = librosa.load(temp_path, sr=None)

            # Calculate signal-to-noise ratio (simplified)
            rms = librosa.feature.rms(y=y)[0]
            mean_rms = np.mean(rms)

            # Spectral flatness (high = noise-like)
            flatness = np.mean(librosa.feature.spectral_flatness(y=y))

            os.unlink(temp_path)

            noise_level = flatness * 100
            is_noisy = noise_level > 30

            return {
                'noise_level': round(noise_level, 2),
                'is_noisy': is_noisy,
                'audio_quality': 'poor' if is_noisy else 'good'
            }

        except Exception as e:
            return {
                'noise_level': 0,
                'is_noisy': False,
                'audio_quality': 'unknown',
                'error': str(e)
            }
