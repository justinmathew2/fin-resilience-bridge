import os
from pydantic import BaseModel, Field
from typing import List, Optional
from google import genai
from google.genai import types

class ActionStep(BaseModel):
    step_number: int
    title: str = Field(description="Short title of the step")
    description: str = Field(description="Detailed description of the action the user should take")

class ActionPlanResponse(BaseModel):
    policy_number: Optional[str] = Field(description="The extracted policy number if found, or null")
    due_date: Optional[str] = Field(description="The extracted due date if found, or null")
    action_plan: List[ActionStep] = Field(description="Step by step personalized action plan")
    is_data_sufficient: bool = Field(description="True if the image clearly contains an insurance notice and the situation makes sense. False if it's completely unreadable or unstructured.")
    feedback_message: Optional[str] = Field(description="A message to the user if data is insufficient or unclear.")

class PolicyRescueService:
    def __init__(self):
        # Initializes the client using the GEMINI_API_KEY environment variable.
        self.client = genai.Client()
        self.model_name = 'gemini-2.5-flash' # Or gemini-1.5-flash depending on exact availability

    def analyze_policy(self, image_path: str, situation: str) -> dict:
        """
        Takes the image path and the user's situation text,
        calls the Gemini model, and strictly requires the ActionPlanResponse format.
        """
        # Read the file to upload to the service
        # For simplicity, we can pass the raw bytes directly to the generate_content call
        # in the newer google-genai SDK, relying on types.Part.from_bytes.
        
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        mime_type = "image/jpeg"
        if image_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif image_path.lower().endswith(".pdf"):
            mime_type = "application/pdf"

        prompt = f"""
        You are an expert financial and insurance advisor.
        I have provided an image of an insurance notice (like a premium due or cancellation notice).
        
        My current life situation is: "{situation}"
        
        Please analyze the notice carefully. Extract the 'Policy Number' and the 'Due Date' if they exist.
        Then, considering my life situation, provide a structured 'Action Plan' with step-by-step advice on what I should do next.
        
        If the image is NOT an insurance notice or is completely unreadable/unstructured, set `is_data_sufficient` to false and provide a `feedback_message` explaining what was wrong, but you can leave `policy_number` and `due_date` as null.
        """

        try:
            # We configure generation to enforce the Pydantic schema
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ActionPlanResponse,
                    temperature=0.2, # Keep hallucination low for document extraction
                ),
            )
            
            # The response.text is guaranteed to be a JSON string matching the Pydantic schema
            import json
            result_dict = json.loads(response.text)
            
            # Business logic: if the LLM marks the data as insufficient, raise our specific validation error
            if not result_dict.get("is_data_sufficient", True):
                msg = result_dict.get("feedback_message", "The provided document is incomplete or unstructured.")
                raise ValueError(msg)
                
            return result_dict
            
        except Exception as e:
            # Reraise ValueError so it hits the 422 block in app.py
            if isinstance(e, ValueError):
                raise e
            raise Exception(f"Google Gemini Service error: {str(e)}")
