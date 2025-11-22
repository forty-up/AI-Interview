import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    """Using Groq as backend instead of Gemini"""

    def __init__(self):
        self.client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.model = "llama-3.3-70b-versatile"

    def generate_content(self, prompt, max_tokens=2048, temperature=0.7):
        """Generate content using Groq"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Generation error: {e}")
            raise e

    def generate_flashcards(self, subject, topic, count=10, difficulty='medium'):
        """Generate flashcards for a topic"""
        prompt = f"""Create {count} educational flashcards for {subject} - {topic}.
        Difficulty: {difficulty}

        Format each flashcard as:
        Q: [Clear, concise question]
        A: [Comprehensive but brief answer]

        Cover key concepts progressively from basic to advanced.
        Include practical examples where helpful."""

        return self.generate_content(prompt, max_tokens=3000)

    def generate_mcqs(self, subject, topic, count=10, difficulty='medium'):
        """Generate MCQ questions"""
        prompt = f"""Create {count} multiple choice questions for {subject} - {topic}.
        Difficulty: {difficulty}

        Format each question as:
        Q: [Question text]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        Correct: [Letter]
        Explanation: [Why this answer is correct]

        Questions should test understanding, not just memorization."""

        return self.generate_content(prompt, max_tokens=4000)

    def generate_company_questions(self, company, round_type, count=5):
        """Generate company-specific interview questions"""
        company_styles = {
            'amazon': 'Focus on leadership principles and customer obsession. Use behavioral STAR format.',
            'microsoft': 'Emphasize growth mindset and technical depth. Include system design.',
            'infosys': 'Test fundamentals and logical reasoning. Include aptitude elements.',
            'tcs': 'Focus on teamwork and adaptability. Test core technical concepts.',
            'cred': 'Emphasize product thinking and innovation. Include UX considerations.'
        }

        style = company_styles.get(company.lower(), 'Standard technical interview format.')

        prompt = f"""Generate {count} interview questions for {company} - {round_type} round.

        Company Style: {style}

        Format:
        1. [Question]
        Expected Focus: [Key points to cover]

        Make questions progressively challenging."""

        return self.generate_content(prompt, max_tokens=2000)

    def explain_concept(self, concept, subject):
        """Generate detailed explanation of a concept"""
        prompt = f"""Explain the concept of "{concept}" in {subject}:

        1. Definition
        2. Key Points
        3. Example/Use Case
        4. Common Mistakes
        5. Interview Tips

        Keep it concise but comprehensive."""

        return self.generate_content(prompt, max_tokens=1500)

    def generate_study_plan(self, weak_areas, duration_weeks=4):
        """Generate a study plan based on weak areas"""
        prompt = f"""Create a {duration_weeks}-week study plan for these weak areas:
        {', '.join(weak_areas)}

        For each week, provide:
        - Topics to cover
        - Recommended resources (free)
        - Practice tasks
        - Mini-milestones

        Keep it realistic and achievable."""

        return self.generate_content(prompt, max_tokens=2500)
