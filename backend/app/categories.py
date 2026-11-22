SCHEME_CATEGORIES = [
    {"id": "education-scholarships", "name": "Education & Scholarships", "name_te": "విద్య & ఉపకార వేతనాలు"},
    {"id": "agriculture", "name": "Agriculture", "name_te": "వ్యవసాయం"},
    {"id": "women-child-welfare", "name": "Women & Child Welfare", "name_te": "మహిళా & శిశు సంక్షేమం"},
    {"id": "employment-skills", "name": "Employment & Skills", "name_te": "ఉపాధి & నైపుణ్యాలు"},
    {"id": "healthcare", "name": "Healthcare", "name_te": "ఆరోగ్య సంరక్షణ"},
    {"id": "housing", "name": "Housing", "name_te": "గృహ నిర్మాణం"},
    {"id": "social-security", "name": "Social Security", "name_te": "సామాజిక భద్రత"},
]

CATEGORY_ALIASES = {
    alias.casefold(): category["id"]
    for category in SCHEME_CATEGORIES
    for alias in (category["id"], category["name"], category["name_te"])
}


def normalize_category(value: str) -> str:
    return CATEGORY_ALIASES.get(value.strip().casefold(), value.strip())
