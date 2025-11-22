from services.groq_service import GroqService
from services.gemini_service import GeminiService
from services.langchain_service import LangChainService


class InterviewPipeline:
    def __init__(self):
        self.groq = GroqService()
        self.gemini = GeminiService()
        self.langchain = LangChainService()

        # Question banks by round type
        self.question_templates = {
            'hr': [
                "Tell me about yourself.",
                "Why do you want to work at {company}?",
                "What are your strengths and weaknesses?",
                "Where do you see yourself in 5 years?",
                "Describe a challenging situation and how you handled it.",
                "Why should we hire you?",
                "What motivates you?",
                "How do you handle pressure?",
                "Tell me about a time you worked in a team.",
                "What are your salary expectations?"
            ],
            'technical': [
                "Explain the concept of {topic}.",
                "What is the difference between {concept1} and {concept2}?",
                "How would you implement {algorithm}?",
                "What are the advantages of {technology}?",
                "Describe the time and space complexity of {operation}.",
                "How does {system} work internally?",
                "What are SOLID principles?",
                "Explain OOP concepts with examples.",
                "What is normalization in databases?",
                "Describe the OSI model layers."
            ],
            'behavioral': [
                "Tell me about a time you failed and what you learned.",
                "Describe a conflict with a teammate and how you resolved it.",
                "Give an example of when you showed leadership.",
                "Tell me about a time you had to learn something quickly.",
                "Describe a situation where you had to make a difficult decision.",
                "How do you prioritize when you have multiple deadlines?",
                "Tell me about a project you're most proud of.",
                "How do you handle criticism?",
                "Describe a time you went above and beyond.",
                "Tell me about a time you disagreed with your manager."
            ],
            'system_design': [
                "Design a URL shortening service like bit.ly.",
                "Design a simple chat application.",
                "How would you design a parking lot system?",
                "Design a basic e-commerce product catalog.",
                "How would you design a rate limiter?",
                "Design a simple notification system.",
                "How would you design a file storage system?",
                "Design a basic recommendation system.",
                "How would you design a caching layer?",
                "Design a simple task scheduler."
            ]
        }

        # Technical topics
        self.topics = {
            'dsa': ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching'],
            'dbms': ['Normalization', 'SQL', 'Transactions', 'Indexing', 'ACID', 'Joins'],
            'os': ['Process', 'Thread', 'Scheduling', 'Memory Management', 'Deadlock', 'Synchronization'],
            'cn': ['OSI Model', 'TCP/IP', 'HTTP', 'DNS', 'Routing', 'Security'],
            'oops': ['Classes', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction']
        }

    def generate_questions(self, round_type='technical', company='general', topic='', count=5, persona='strict_senior'):
        """Generate interview questions based on parameters"""
        try:
            # Build prompt for AI generation
            prompt = f"""Generate {count} interview questions for a {round_type} round.
            Company: {company}
            {'Topic focus: ' + topic if topic else ''}

            Requirements:
            - Questions should be realistic and commonly asked
            - Progress from basic to challenging
            - For technical: include follow-up points
            - For behavioral: use STAR format triggers

            Format each question as:
            Q[number]: [Question text]
            Focus: [Key points interviewer looks for]

            Generate exactly {count} questions."""

            response = self.groq.fast_generate(prompt, max_tokens=1500)

            # Parse questions
            questions = []
            lines = response.split('\n')
            current_q = None
            current_focus = None

            for line in lines:
                line = line.strip()
                if line.startswith('Q') and ':' in line:
                    if current_q:
                        questions.append({
                            'text': current_q,
                            'focus': current_focus or ''
                        })
                    current_q = line.split(':', 1)[1].strip()
                    current_focus = None
                elif 'Focus:' in line:
                    current_focus = line.split(':', 1)[1].strip()

            if current_q:
                questions.append({
                    'text': current_q,
                    'focus': current_focus or ''
                })

            # Ensure we have enough questions
            while len(questions) < count:
                templates = self.question_templates.get(round_type, self.question_templates['technical'])
                template_text = templates[len(questions) % len(templates)]
                # Format template placeholders
                formatted_text = self._format_template(template_text, topic, company)
                questions.append({
                    'text': formatted_text,
                    'focus': 'Standard interview question'
                })

            return questions[:count]

        except Exception as e:
            # Fallback to templates
            templates = self.question_templates.get(round_type, self.question_templates['technical'])
            return [{'text': self._format_template(q, topic, company), 'focus': ''} for q in templates[:count]]

    def _format_template(self, template, topic='', company='general'):
        """Format question template with actual values"""
        # Get a random topic if not specified
        if not topic:
            import random
            all_topics = []
            for topics in self.topics.values():
                all_topics.extend(topics)
            topic = random.choice(all_topics) if all_topics else 'programming'

        replacements = {
            '{topic}': topic,
            '{company}': company.title() if company else 'the company',
            '{concept1}': 'stack',
            '{concept2}': 'queue',
            '{algorithm}': 'binary search',
            '{technology}': 'microservices',
            '{operation}': 'sorting',
            '{system}': 'database indexing'
        }

        result = template
        for key, value in replacements.items():
            result = result.replace(key, value)

        return result

    def evaluate_answer(self, question, answer, round_type='technical'):
        """Evaluate user's answer using AI"""
        try:
            evaluation = self.groq.evaluate_answer(question, answer)
            return evaluation
        except Exception as e:
            # Return default scores on error
            return {
                'scores': {
                    'technical_correctness': 60,
                    'communication_skills': 60,
                    'answer_structure': 60,
                    'reasoning_depth': 60,
                    'completeness': 60,
                    'overall': 60
                },
                'feedback': 'Unable to evaluate. Please try again.',
                'suggestions': ['Continue practicing']
            }

    def generate_follow_up(self, question, answer, evaluation=None):
        """Generate follow-up questions based on the answer"""
        try:
            follow_ups = self.groq.generate_follow_up(question, answer)
            return follow_ups
        except Exception as e:
            return [
                "Can you explain that in more detail?",
                "What would be an alternative approach?"
            ]

    def analyze_communication(self, transcription):
        """Analyze communication patterns and provide tips"""
        try:
            analysis = self.langchain.analyze_communication(transcription)

            # Parse into tips
            tips = []
            for line in analysis.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                    tips.append(line[1:].strip())
                elif line and len(line) > 10:
                    tips.append(line)

            # Filter and categorize tips
            filler_tips = []
            pace_tips = []
            clarity_tips = []

            filler_words = ['um', 'uh', 'like', 'you know', 'basically', 'actually']

            for tip in tips:
                tip_lower = tip.lower()
                if any(word in tip_lower for word in filler_words):
                    filler_tips.append(tip)
                elif 'pace' in tip_lower or 'speed' in tip_lower or 'fast' in tip_lower or 'slow' in tip_lower:
                    pace_tips.append(tip)
                else:
                    clarity_tips.append(tip)

            return {
                'filler_word_tips': filler_tips[:2],
                'pace_tips': pace_tips[:2],
                'clarity_tips': clarity_tips[:3],
                'all_tips': tips[:5]
            }

        except Exception as e:
            return {
                'filler_word_tips': [],
                'pace_tips': [],
                'clarity_tips': ['Speak clearly and confidently'],
                'all_tips': ['Continue practicing your answers']
            }

    def get_company_context(self, company):
        """Get company-specific context for question generation"""
        contexts = {
            'amazon': {
                'principles': ['Customer Obsession', 'Ownership', 'Invent and Simplify', 'Hire and Develop the Best'],
                'style': 'Data-driven, customer-focused, leadership principles',
                'common_topics': ['system design', 'behavioral STAR', 'coding']
            },
            'microsoft': {
                'principles': ['Growth Mindset', 'Customer Focus', 'Diversity and Inclusion'],
                'style': 'Collaborative, technical depth, innovation',
                'common_topics': ['coding', 'system design', 'behavioral']
            },
            'infosys': {
                'principles': ['Client Value', 'Leadership by Example', 'Integrity'],
                'style': 'Process-oriented, fundamentals, aptitude',
                'common_topics': ['fundamentals', 'aptitude', 'communication']
            },
            'tcs': {
                'principles': ['Learning', 'Excellence', 'Collaboration'],
                'style': 'Team-oriented, adaptable, continuous learning',
                'common_topics': ['fundamentals', 'project experience', 'teamwork']
            },
            'cred': {
                'principles': ['User-first', 'Innovation', 'Excellence'],
                'style': 'Product thinking, user experience, innovation',
                'common_topics': ['product sense', 'coding', 'system design']
            }
        }

        return contexts.get(company.lower(), {
            'principles': [],
            'style': 'Standard technical interview',
            'common_topics': ['technical', 'behavioral']
        })

    def generate_persona_response(self, persona, context, user_answer):
        """Generate response based on interviewer persona"""
        persona_prompts = {
            'strict_senior': f"As a strict senior engineer, provide direct and critical feedback on this answer: {user_answer}",
            'friendly_hr': f"As a friendly HR interviewer, provide encouraging but constructive feedback on this answer: {user_answer}",
            'curious_fresher': f"As a curious junior developer, ask clarifying questions about this answer: {user_answer}",
            'logical_lead': f"As a logical tech lead, analyze this answer step by step: {user_answer}"
        }

        prompt = persona_prompts.get(persona, persona_prompts['strict_senior'])
        prompt += f"\n\nContext: {context}"

        try:
            response = self.groq.fast_generate(prompt, max_tokens=500)
            return response
        except Exception as e:
            return "Thank you for your answer. Let's move on to the next question."
