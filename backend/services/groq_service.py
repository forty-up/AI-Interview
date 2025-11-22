import os
from groq import Groq
from dotenv import load_dotenv
import tempfile

load_dotenv()


class GroqService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.default_model = "llama-3.3-70b-versatile"
        self.fast_model = "llama-3.3-70b-versatile"

    def generate_content(self, prompt, model=None, max_tokens=2048, temperature=0.7):
        """Generate content using Groq LLaMA or Mixtral"""
        try:
            response = self.client.chat.completions.create(
                model=model or self.default_model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant for interview preparation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq generation error: {e}")
            raise e

    def transcribe_audio(self, audio_file):
        """Transcribe audio using Groq Whisper"""
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                audio_file.save(temp_file.name)
                temp_path = temp_file.name

            # Transcribe
            with open(temp_path, 'rb') as f:
                transcription = self.client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=f,
                    response_format="text"
                )

            # Clean up
            os.unlink(temp_path)

            return transcription

        except Exception as e:
            print(f"Transcription error: {e}")
            raise e

    def evaluate_answer(self, question, answer, context=""):
        """Evaluate an interview answer"""
        prompt = f"""Evaluate this interview answer:

Question: {question}
Answer: {answer}
{f'Context: {context}' if context else ''}

Provide scores (0-100) for:
1. Technical Correctness
2. Communication Skills
3. Answer Structure
4. Reasoning Depth
5. Completeness

Also provide brief feedback and suggestions for improvement.

Format:
technical_correctness: [score]
communication_skills: [score]
answer_structure: [score]
reasoning_depth: [score]
completeness: [score]
feedback: [feedback text]
suggestions: [suggestions text]"""

        response = self.generate_content(prompt)
        print(f"Evaluation response:\n{response[:500]}...")  # Log first 500 chars
        return self._parse_evaluation(response)

    def _parse_evaluation(self, response):
        """Parse evaluation response into structured format"""
        import re

        scores = {
            'technical_correctness': 70,
            'communication_skills': 70,
            'answer_structure': 70,
            'reasoning_depth': 70,
            'completeness': 70
        }
        feedback = ""
        suggestions = []

        lines = response.split('\n')
        for line in lines:
            line_lower = line.lower().strip()

            # Check for each score type
            for key in scores:
                key_variants = [
                    key.replace('_', ' '),
                    key.replace('_', ''),
                    key.replace('_', '-')
                ]
                if any(variant in line_lower for variant in key_variants):
                    # Extract numbers using regex
                    numbers = re.findall(r'\d+', line)
                    if numbers:
                        score = int(numbers[-1])  # Take last number found
                        scores[key] = min(100, max(0, score))
                        print(f"Parsed {key}: {scores[key]}")

            if 'feedback' in line_lower and ':' in line:
                feedback = line.split(':', 1)[-1].strip()

            if 'suggestion' in line_lower and ':' in line:
                suggestions.append(line.split(':', 1)[-1].strip())

        scores['overall'] = round(sum(scores.values()) / len(scores), 1)

        return {
            'scores': scores,
            'feedback': feedback or "Good attempt. Continue practicing to improve.",
            'suggestions': suggestions or ["Practice more questions on this topic"]
        }

    def generate_follow_up(self, question, answer):
        """Generate follow-up questions based on the answer"""
        prompt = f"""Based on this interview Q&A, generate 2-3 relevant follow-up questions:

Question: {question}
Answer: {answer}

The follow-ups should:
- Dig deeper into mentioned concepts
- Test understanding of related topics
- Challenge any assumptions made

Format each on a new line starting with "- "."""

        response = self.generate_content(prompt, model=self.fast_model, max_tokens=500)

        follow_ups = []
        for line in response.split('\n'):
            line = line.strip()
            if line.startswith('- ') or line.startswith('• '):
                follow_ups.append(line[2:].strip())
            elif line and not line.startswith('#') and len(line) > 20:
                follow_ups.append(line)

        return follow_ups[:3]

    def fast_generate(self, prompt, max_tokens=1024):
        """Fast generation using Mixtral"""
        return self.generate_content(prompt, model=self.fast_model, max_tokens=max_tokens)
