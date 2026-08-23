import pandas as pd
import json
import os
import re


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Original Mendeley disease + symptoms dataset
DATASET_PATH = os.path.join(
    BASE_DIR,
    "..",
    "..",
    "Disease and symptoms dataset.csv"
)

# CSV containing the 527 diseases selected for CureCast
SELECTED_DISEASES_PATH = os.path.join(
    BASE_DIR,
    "..",
    "..",
    "disease_list_with_counts.csv"
)

# Folder where the medical JSON documents will be generated
OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "data",
    "medical_docs"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# HELPERS
# ============================================================

def normalize_name(value):
    """
    Normalize disease names so that small differences in
    capitalization, punctuation, hyphens, brackets, etc.
    do not prevent matching.
    """

    value = str(value).lower().strip()

    value = re.sub(
        r"[^a-z0-9]+",
        " ",
        value
    )

    return " ".join(value.split())


def safe_filename(value):
    """
    Convert disease name into a safe JSON filename.
    """

    return re.sub(
        r"[^a-zA-Z0-9]+",
        "_",
        str(value)
    ).strip("_")


def is_positive(value):
    """
    Detect whether a symptom column indicates that
    the symptom is present.

    Handles:
        1
        1.0
        True
        Yes
        Y
    """

    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value == 1

    value = str(value).strip().lower()

    return value in {
        "1",
        "1.0",
        "true",
        "yes",
        "y"
    }


# ============================================================
# START
# ============================================================

print("\n============================================")
print("     CureCast Medical Document Generator")
print("============================================")


# ============================================================
# LOAD ORIGINAL DATASET
# ============================================================

print("\nLoading original disease/symptom dataset...")

if not os.path.exists(DATASET_PATH):

    raise FileNotFoundError(
        f"""
Original dataset was not found.

Expected location:

{DATASET_PATH}

Make sure the original Mendeley CSV is present
in the CureCast project root and is named:

Disease and symptoms dataset.csv
"""
    )


df = pd.read_csv(
    DATASET_PATH
)

print(
    f"Dataset shape: {df.shape}"
)

print(
    f"Number of columns: {len(df.columns)}"
)


# ============================================================
# FIND DISEASE COLUMN
# ============================================================

disease_column = None

for column in df.columns:

    normalized = str(
        column
    ).strip().lower()

    if normalized in {
        "disease",
        "diseases",
        "prognosis",
        "diagnosis"
    }:

        disease_column = column
        break


if disease_column is None:

    raise ValueError(
        "\nCould not find disease column.\n"
        f"Available columns:\n{df.columns.tolist()}"
    )


print(
    f"Disease column: {disease_column}"
)


# ============================================================
# LOAD SELECTED DISEASE LIST
# ============================================================

print(
    "\nLoading selected CureCast disease list..."
)

if not os.path.exists(
    SELECTED_DISEASES_PATH
):

    raise FileNotFoundError(
        f"""
Could not find:

{SELECTED_DISEASES_PATH}
"""
    )


selected_df = pd.read_csv(
    SELECTED_DISEASES_PATH
)


# ============================================================
# FIND SELECTED DISEASE COLUMN
# ============================================================

selected_disease_column = None

for column in selected_df.columns:

    normalized = str(
        column
    ).strip().lower()

    if normalized in {
        "disease",
        "diseases",
        "prognosis",
        "diagnosis"
    }:

        selected_disease_column = column
        break


if selected_disease_column is None:

    raise ValueError(
        "\nCould not find disease column in "
        "disease_list_with_counts.csv.\n"
        f"Available columns:\n"
        f"{selected_df.columns.tolist()}"
    )


# ============================================================
# GET SELECTED DISEASES
# ============================================================

selected_diseases = (
    selected_df[
        selected_disease_column
    ]
    .dropna()
    .astype(str)
    .str.strip()
    .unique()
)

print(
    f"Selected diseases: "
    f"{len(selected_diseases)}"
)


# ============================================================
# BUILD DATASET DISEASE LOOKUP
# ============================================================

print(
    "\nBuilding disease lookup..."
)

dataset_diseases = (
    df[disease_column]
    .dropna()
    .astype(str)
    .str.strip()
    .unique()
)


disease_lookup = {}

for disease in dataset_diseases:

    disease_lookup[
        normalize_name(disease)
    ] = disease


print(
    f"Diseases available in original dataset: "
    f"{len(dataset_diseases)}"
)


# ============================================================
# DETERMINE SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in df.columns
    if column != disease_column
]


print(
    f"Potential symptom columns: "
    f"{len(symptom_columns)}"
)


# ============================================================
# IMPORTANT:
# REMOVE OLD JSON FILES
# ============================================================

print(
    "\nRemoving old medical JSON files..."
)

old_files_removed = 0

for old_file in os.listdir(
    OUTPUT_DIR
):

    old_file_path = os.path.join(
        OUTPUT_DIR,
        old_file
    )

    if (
        os.path.isfile(old_file_path)
        and
        old_file.lower().endswith(".json")
    ):

        os.remove(
            old_file_path
        )

        old_files_removed += 1


print(
    f"Removed {old_files_removed} old JSON files."
)


# ============================================================
# GENERATE DOCUMENTS
# ============================================================

created = 0
missing = 0
empty = 0

missing_diseases = []

print(
    "\nGenerating fresh medical documents...\n"
)


for selected_disease in selected_diseases:

    selected_disease = str(
        selected_disease
    ).strip()

    normalized_selected = normalize_name(
        selected_disease
    )


    # --------------------------------------------------------
    # Find actual disease name in original dataset
    # --------------------------------------------------------

    actual_disease = disease_lookup.get(
        normalized_selected
    )


    if actual_disease is None:

        print(
            f"[MISSING] {selected_disease}"
        )

        missing += 1

        missing_diseases.append(
            selected_disease
        )

        continue


    # --------------------------------------------------------
    # Find all rows belonging to this disease
    # --------------------------------------------------------

    disease_mask = (
        df[disease_column]
        .astype(str)
        .map(normalize_name)
        == normalized_selected
    )


    disease_rows = df.loc[
        disease_mask
    ]


    # --------------------------------------------------------
    # Extract real symptoms
    # --------------------------------------------------------

    symptoms = []


    for column in symptom_columns:

        column_values = disease_rows[
            column
        ]


        found = False


        for value in column_values:

            if is_positive(value):

                found = True
                break


        if found:

            symptom_name = str(
                column
            ).strip()

            symptoms.append(
                symptom_name
            )


    # --------------------------------------------------------
    # Remove duplicate symptoms
    # --------------------------------------------------------

    symptoms = sorted(
        set(symptoms),
        key=lambda x: x.lower()
    )


    # --------------------------------------------------------
    # Handle diseases with no symptoms
    # --------------------------------------------------------

    if len(symptoms) == 0:

        print(
            f"[WARNING] "
            f"{actual_disease}: "
            f"0 symptoms"
        )

        empty += 1


    # --------------------------------------------------------
    # Create medical document
    # --------------------------------------------------------

    document = {

        "disease": actual_disease,

        "description": (
            f"{actual_disease} is associated "
            f"with the symptoms listed in the "
            f"CureCast disease-symptom dataset."
        ),

        "symptoms": symptoms,

        "causes": (
            "Cause information is not provided "
            "by the source disease-symptom dataset."
        ),

        "when_to_see_doctor": (
            "Consult a qualified healthcare "
            "professional for diagnosis and "
            "appropriate medical advice."
        )
    }


    # --------------------------------------------------------
    # Create filename
    # --------------------------------------------------------

    filename = (
        safe_filename(
            actual_disease
        )
        + ".json"
    )


    file_path = os.path.join(
        OUTPUT_DIR,
        filename
    )


    # --------------------------------------------------------
    # WRITE FILE
    #
    # "w" means overwrite.
    # Therefore old placeholder files are replaced.
    # --------------------------------------------------------

    with open(
        file_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            document,
            file,
            indent=2,
            ensure_ascii=False
        )


    created += 1


    print(
        f"[OK] {actual_disease}: "
        f"{len(symptoms)} symptoms"
    )


# ============================================================
# CHECK FOR PLACEHOLDERS
# ============================================================

print(
    "\nChecking generated documents..."
)

placeholder_files = []


for filename in os.listdir(
    OUTPUT_DIR
):

    if not filename.lower().endswith(
        ".json"
    ):
        continue


    file_path = os.path.join(
        OUTPUT_DIR,
        filename
    )


    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            document = json.load(
                file
            )


        text = json.dumps(
            document
        ).lower()


        if (
            "placeholder symptom 1"
            in text
            or
            "placeholder symptom 2"
            in text
        ):

            placeholder_files.append(
                filename
            )


    except Exception as error:

        print(
            f"[ERROR] Could not read "
            f"{filename}: {error}"
        )


# ============================================================
# FINAL SUMMARY
# ============================================================

print(
    "\n============================================"
)

print(
    "       GENERATION COMPLETE"
)

print(
    "============================================"
)

print(
    f"Selected diseases : "
    f"{len(selected_diseases)}"
)

print(
    f"Documents created : "
    f"{created}"
)

print(
    f"Missing diseases  : "
    f"{missing}"
)

print(
    f"Zero-symptom docs : "
    f"{empty}"
)

print(
    f"Old files removed : "
    f"{old_files_removed}"
)

print(
    f"Placeholder files : "
    f"{len(placeholder_files)}"
)


# ============================================================
# SHOW MISSING DISEASES
# ============================================================

if missing_diseases:

    print(
        "\nMissing diseases:"
    )

    for disease in missing_diseases:

        print(
            f"  - {disease}"
        )


# ============================================================
# SHOW PLACEHOLDER FILES
# ============================================================

if placeholder_files:

    print(
        "\nERROR: Placeholder files still exist:"
    )

    for filename in placeholder_files:

        print(
            f"  - {filename}"
        )

    raise RuntimeError(
        "\nPlaceholder documents still exist. "
        "Do not build the FAISS index yet."
    )


# ============================================================
# FINAL VALIDATION
# ============================================================

json_files = [
    filename
    for filename in os.listdir(
        OUTPUT_DIR
    )
    if filename.lower().endswith(
        ".json"
    )
]


print(
    f"\nJSON files currently in medical_docs: "
    f"{len(json_files)}"
)


if len(json_files) != created:

    print(
        "\nWARNING:"
    )

    print(
        "Number of JSON files does not match "
        "number of documents created."
    )


print(
    "\n============================================"
)

print(
    "Medical document generation finished."
)

print(
    "You can now run ingest.py."
)

print(
    "============================================\n"
)