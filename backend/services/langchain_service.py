import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

load_dotenv()


class LangChainService:
    def __init__(self):
        # Initialize Groq LLM
        self.groq_llm = ChatGroq(
            api_key=os.getenv('GROQ_API_KEY'),
            model_name="llama-3.3-70b-versatile",
            temperature=0.7
        )

    def generate_content(self, prompt):
        """Generate content using Groq LLM"""
        try:
            response = self.groq_llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"LangChain generation error: {e}")
            raise e

    def create_interview_chain(self, persona):
        """Create an interview chain with specific persona"""
        personas = {
            'strict_senior': """You are a strict senior engineer conducting an interview.
                Be direct, expect precise technical answers, and ask challenging follow-ups.""",
            'friendly_hr': """You are a friendly HR interviewer.
                Be warm and encouraging while assessing soft skills.""",
            'curious_fresher': """You are a curious junior developer on the interview panel.
                Ask clarifying questions to understand the approach.""",
            'logical_lead': """You are a logical tech lead conducting the interview.
                Analyze approaches systematically, step by step."""
        }

        system_prompt = personas.get(persona, personas['strict_senior'])

        template = f"""{system_prompt}

        Current question/topic: {{input}}

        Provide your response as the interviewer:"""

        prompt = PromptTemplate(input_variables=["input"], template=template)
        return LLMChain(llm=self.groq_llm, prompt=prompt)

    def evaluate_with_reasoning(self, question, answer, criteria):
        """Evaluate answer with step-by-step reasoning"""
        template = """Evaluate this interview answer:

        Question: {question}
        Answer: {answer}
        Criteria: {criteria}

        Provide:
        - Overall score (0-100)
        - Key strengths
        - Areas for improvement
        - Specific feedback"""

        prompt = PromptTemplate(
            input_variables=["question", "answer", "criteria"],
            template=template
        )
        chain = LLMChain(llm=self.groq_llm, prompt=prompt)
        return chain.run(question=question, answer=answer, criteria=criteria)

    def generate_knowledge_graph_analysis(self, quiz_results, interview_results):
        """Analyze results to build knowledge graph"""
        template = """Analyze these learning results:

        Quiz Results: {quiz_results}
        Interview Results: {interview_results}

        Provide:
        1. Strong areas
        2. Weak areas
        3. Recommended learning path"""

        prompt = PromptTemplate(
            input_variables=["quiz_results", "interview_results"],
            template=template
        )
        chain = LLMChain(llm=self.groq_llm, prompt=prompt)
        return chain.run(quiz_results=str(quiz_results), interview_results=str(interview_results))

    def create_study_plan_chain(self):
        """Create a chain for generating study plans"""
        template = """Create a study plan for:

        Weak Areas: {weak_areas}
        Time: {time_available}
        Target Companies: {target_companies}
        Level: {current_level}

        Provide week-by-week plan with topics and resources."""

        prompt = PromptTemplate(
            input_variables=["weak_areas", "time_available", "target_companies", "current_level"],
            template=template
        )
        return LLMChain(llm=self.groq_llm, prompt=prompt)

    def multi_agent_discussion(self, topic, num_turns=3):
        """Simulate multi-agent group discussion"""
        agents = [
            ("Analytical", "Data-driven arguments"),
            ("Creative", "Innovative perspectives"),
            ("Pragmatic", "Practical solutions")
        ]

        discussion = []
        for turn in range(num_turns):
            for agent_name, agent_style in agents:
                context = "\n".join([f"{d['agent']}: {d['statement']}" for d in discussion[-6:]])
                prompt = f"""You are {agent_name} in a group discussion.
                Style: {agent_style}
                Topic: {topic}
                Previous: {context}

                Provide 2-3 sentences."""

                response = self.generate_content(prompt)
                discussion.append({'agent': agent_name, 'statement': response.strip()})

        return discussion

    def analyze_communication(self, transcription):
        """Analyze communication patterns"""
        template = """Analyze this transcription:

        {transcription}

        Identify filler words, pace, clarity.
        Provide improvement tips."""

        prompt = PromptTemplate(input_variables=["transcription"], template=template)
        chain = LLMChain(llm=self.groq_llm, prompt=prompt)
        return chain.run(transcription=transcription)

    def generate_meta_analysis(self, interviews):
        """Generate cross-interview analysis"""
        template = """Analyze interview performances:

        Data: {interviews}

        Provide trends, strengths, mistakes, improvement rate."""

        prompt = PromptTemplate(input_variables=["interviews"], template=template)
        chain = LLMChain(llm=self.groq_llm, prompt=prompt)
        return chain.run(interviews=str(interviews))
