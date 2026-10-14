# API Failure Pattern Miner

API Failure Pattern Miner is a data mining project that analyzes API logs to identify unusual response times and discover patterns linked to API performance issues.

The project uses data preprocessing, exploratory data analysis, and visualization to understand API behaviour. It applies the **Interquartile Range (IQR)** method to detect latency outliers, **Apriori association rule mining** to find relationships between workload conditions and API outcomes, and **K-Means and hierarchical clustering** to group similar API requests.

## Features

- Clean and preprocess API log data
- Analyze response times, HTTP status codes, and workload levels
- Detect unusual latency using IQR
- Discover associations using the Apriori algorithm
- Group similar API requests using clustering
- Visualize performance patterns and analysis results

## Tech Stack

- Python
- Pandas and NumPy
- Matplotlib and Seaborn
- MLxtend
- Scikit-learn
- Google Colab

## Getting Started

1. Open the project notebook in Google Colab.
2. Upload the `api_logs.csv` dataset.
3. Install any required libraries that are not already available.
4. Run the notebook cells in order to preprocess the data, perform analysis, and generate visualizations.

## Objective

The goal is to make API log analysis easier by identifying unusual behaviour and recurring patterns that can help developers investigate potential performance and reliability issues.

**Note:** The discovered patterns show associations, not necessarily cause-and-effect relationships.

## Repository

[View the project on GitHub](https://github.com/sirinithya0806-cmyk/API-Failure-Pattern-Miner)
