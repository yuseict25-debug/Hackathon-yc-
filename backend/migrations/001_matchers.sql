-- Personality profiles per room session for matching
CREATE TABLE IF NOT EXISTS matchers (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    social_energy FLOAT,
    expressiveness FLOAT,
    emotional_warmth FLOAT,
    emotional_stability FLOAT,
    optimism FLOAT,
    analytical_vs_intuitive FLOAT,
    structured_vs_spontaneous FLOAT,
    decision_speed FLOAT,
    proactivity FLOAT,
    risk_tolerance FLOAT,
    novelty_seeking FLOAT,
    communication_directness FLOAT,
    communication_verbosity FLOAT,
    cooperativeness FLOAT,
    trust_level FLOAT,
    independence_orientation FLOAT,
    achievement_orientation FLOAT,
    tradition_vs_innovation FLOAT
);
