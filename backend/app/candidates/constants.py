STAGES = [
    "Applied",
    "Screening",
    "Interview",
    "Offer",
    "Hired",
]

TERMINAL_STAGES = {
    "Hired",
    "Rejected",
}

NEXT_STAGE = {
    "Applied": "Screening",
    "Screening": "Interview",
    "Interview": "Offer",
    "Offer": "Hired",
}