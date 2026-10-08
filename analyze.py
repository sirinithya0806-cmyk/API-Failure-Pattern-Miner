import pandas as pd
import json

from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules


# ============================================================
# 1. LOAD DATA
# ============================================================

df = pd.read_csv("api_logs.csv")


# ============================================================
# 2. SELECT SEARCH API
# ============================================================

search_df = df[
    df["endpoint"].str.startswith("/api/search")
].copy()


# ============================================================
# 3. CREATE PERFORMANCE LABEL
# ============================================================

threshold = search_df["response_time_ms"].quantile(0.75)

search_df["performance"] = search_df["response_time_ms"].apply(
    lambda x: "DEGRADED" if x >= threshold else "NORMAL"
)


# ============================================================
# 4. CONVERT NUMERICAL FEATURES INTO LEVELS
# ============================================================

search_df["request_rate_level"] = pd.qcut(
    search_df["request_rate"],
    q=3,
    labels=["LOW", "MEDIUM", "HIGH"],
    duplicates="drop"
)

search_df["cpu_level"] = pd.qcut(
    search_df["cpu_percent"],
    q=3,
    labels=["LOW", "MEDIUM", "HIGH"],
    duplicates="drop"
)

search_df["memory_level"] = pd.qcut(
    search_df["memory_mb"],
    q=3,
    labels=["LOW", "MEDIUM", "HIGH"],
    duplicates="drop"
)


# ============================================================
# 5. CREATE TRANSACTIONS
# ============================================================

transactions = []

for _, row in search_df.iterrows():

    transaction = [
        "request_rate_" + str(row["request_rate_level"]),
        "cpu_" + str(row["cpu_level"]),
        "memory_" + str(row["memory_level"]),
        "workload_" + str(row["workload_level"]),
        "performance_" + str(row["performance"])
    ]

    transactions.append(transaction)


# ============================================================
# 6. ONE-HOT ENCODING
# ============================================================

encoder = TransactionEncoder()

encoded_data = encoder.fit(
    transactions
).transform(
    transactions
)

transaction_df = pd.DataFrame(
    encoded_data,
    columns=encoder.columns_
)


# ============================================================
# 7. APRIORI MINING
# ============================================================

frequent_itemsets = apriori(
    transaction_df,
    min_support=0.10,
    use_colnames=True
)


# ============================================================
# 8. ASSOCIATION RULE MINING
# ============================================================

rules = association_rules(
    frequent_itemsets,
    metric="confidence",
    min_threshold=0.60
)


# ============================================================
# 9. SELECT DEGRADATION RULES
# ============================================================

degradation_rules = rules[
    rules["consequents"].apply(
        lambda x:
        "performance_DEGRADED" in x
    )
].copy()


# ============================================================
# 10. SORT RULES
# ============================================================

if not degradation_rules.empty:

    degradation_rules = degradation_rules.sort_values(
        ["lift", "confidence"],
        ascending=False
    )


# ============================================================
# 11. DISPLAY RULES
# ============================================================

print("\n===== DEGRADATION RULES =====")

if degradation_rules.empty:

    print("No degradation rules found.")

else:

    print(
        degradation_rules[
            [
                "antecedents",
                "consequents",
                "support",
                "confidence",
                "lift"
            ]
        ].to_string(index=False)
    )


# ============================================================
# 12. SAVE MINING RESULTS
# ============================================================

if not degradation_rules.empty:

    rules_to_save = degradation_rules[
        [
            "antecedents",
            "consequents",
            "support",
            "confidence",
            "lift"
        ]
    ].copy()

    # Convert frozenset values into readable text
    rules_to_save["antecedents"] = rules_to_save[
        "antecedents"
    ].apply(
        lambda x: ", ".join(sorted(list(x)))
    )

    rules_to_save["consequents"] = rules_to_save[
        "consequents"
    ].apply(
        lambda x: ", ".join(sorted(list(x)))
    )

    rules_to_save.to_csv(
        "degradation_rules.csv",
        index=False
    )

    print(
        "\nSaved mining results to: degradation_rules.csv"
    )

else:

    print(
        "\nNo degradation rules to save."
    )


# ============================================================
# 13. MINING SUMMARY
# ============================================================

print("\n===== MINING SUMMARY =====")

print(
    "Total Search API records:",
    len(search_df)
)

print(
    "Normal records:",
    (search_df["performance"] == "NORMAL").sum()
)

print(
    "Degraded records:",
    (search_df["performance"] == "DEGRADED").sum()
)

print(
    f"Degradation threshold: {threshold:.2f} ms"
)

print(
    "Frequent itemsets:",
    len(frequent_itemsets)
)

print(
    "Degradation rules:",
    len(degradation_rules)
)


# ============================================================
# 14. CREATE DEGRADATION PATTERN VISUALIZATION
# ============================================================

import matplotlib.pyplot as plt


if not degradation_rules.empty:

    # Create readable rule names
    rule_names = []

    for _, row in degradation_rules.iterrows():

        antecedent = " + ".join(
            sorted(list(row["antecedents"]))
        )

        rule_names.append(
            antecedent + " → DEGRADED"
        )

    confidence_values = (
        degradation_rules["confidence"] * 100
    )


    # Create chart
    plt.figure(figsize=(10, 6))

    plt.bar(
        rule_names,
        confidence_values
    )

    plt.xlabel("Discovered Degradation Pattern")

    plt.ylabel("Confidence (%)")

    plt.title(
        "API Performance Degradation Patterns"
    )

    plt.xticks(
        rotation=15,
        ha="right"
    )

    plt.ylim(0, 100)

    plt.tight_layout()


    # Save image
    plt.savefig(
        "degradation_patterns.png",
        dpi=300
    )

    plt.close()

    print(
        "Saved visualization to: degradation_patterns.png"
    )

else:

    print(
        "No degradation patterns available for visualization."
    )


# ============================================================
# 15. CREATE DASHBOARD DATA
# ============================================================

dashboard_rules = []

for _, row in degradation_rules.iterrows():

    antecedent = " + ".join(
        sorted(list(row["antecedents"]))
    )

    dashboard_rules.append({
        "pattern": antecedent + " → DEGRADED",
        "support": round(float(row["support"]) * 100, 2),
        "confidence": round(float(row["confidence"]) * 100, 2),
        "lift": round(float(row["lift"]), 2)
    })


dashboard_data = {

    "total_records": int(len(search_df)),

    "normal_records": int(
        (search_df["performance"] == "NORMAL").sum()
    ),

    "degraded_records": int(
        (search_df["performance"] == "DEGRADED").sum()
    ),

    "degradation_rate": round(
        (
            (search_df["performance"] == "DEGRADED").sum()
            / len(search_df)
        ) * 100,
        2
    ),

    "threshold_ms": round(
        float(threshold),
        2
    ),

    "frequent_itemsets": int(
        len(frequent_itemsets)
    ),

    "degradation_rules": dashboard_rules
}


with open(
    "public/dashboard_data.json",
    "w"
) as file:

    json.dump(
        dashboard_data,
        file,
        indent=4
    )


print(
    "Saved dashboard data to: public/dashboard_data.json"
)


# ============================================================
# 16. CREATE WORKLOAD PERFORMANCE DATA
# ============================================================

workload_order = [
    "normal",
    "moderate",
    "heavy",
    "stress"
]

workload_stats = []

for workload in workload_order:

    workload_data = search_df[
        search_df["workload_level"] == workload
    ]

    if len(workload_data) > 0:

        workload_stats.append({

            "workload": workload,

            "average_response_time": round(
                float(
                    workload_data[
                        "response_time_ms"
                    ].mean()
                ),
                2
            ),

            "median_response_time": round(
                float(
                    workload_data[
                        "response_time_ms"
                    ].median()
                ),
                2
            ),

            "request_count": int(
                len(workload_data)
            )

        })


with open(
    "public/workload_performance.json",
    "w"
) as file:

    json.dump(
        workload_stats,
        file,
        indent=4
    )


print(
    "Saved workload performance data to: "
    "public/workload_performance.json"
)


# ============================================================
# 17. NORMAL VS DEGRADED COMPARISON
# ============================================================

comparison_stats = []

for performance_level in ["NORMAL", "DEGRADED"]:

    performance_data = search_df[
        search_df["performance"] == performance_level
    ]

    comparison_stats.append({

        "performance": performance_level,

        "average_response_time": round(
            float(
                performance_data[
                    "response_time_ms"
                ].mean()
            ),
            2
        ),

        "average_request_rate": round(
            float(
                performance_data[
                    "request_rate"
                ].mean()
            ),
            2
        ),

        "average_cpu_percent": round(
            float(
                performance_data[
                    "cpu_percent"
                ].mean()
            ),
            2
        ),

        "average_memory_mb": round(
            float(
                performance_data[
                    "memory_mb"
                ].mean()
            ),
            2
        ),

        "request_count": int(
            len(performance_data)
        )

    })


with open(
    "public/performance_comparison.json",
    "w"
) as file:

    json.dump(
        comparison_stats,
        file,
        indent=4
    )


print(
    "Saved performance comparison data to: "
    "public/performance_comparison.json"
)