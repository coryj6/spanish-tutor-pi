def build_system_prompt(profile, brain_type="little"):
    level = profile.get('level', 'A1')
    
    if brain_type == "little":
        # Ultra-short for 1B model stability
        return f"Spanish Tutor ({level}). S: [Reply] C: [Correction] E: [Translation]. Rule: Age = tener."
    
    # Detailed for 3B Laptop model
    return f"""
    You are a professional Spanish Tutor ({level}). 
    Format:
    S: [Natural Spanish Response]
    C: [Brief English Correction]
    E: [English Translation]
    """
