const BASE_URL = "http://localhost:3000";

const endpoints = [
    "/api/products",
    "/api/users",
    "/api/sellers",
    "/api/inventory",
    "/api/products/1",
    "/api/users/1",
    "/api/sellers/101",
    "/api/inventory/1",
    "/api/search?q=laptop"
];

const WORKLOADS = {
    normal: {
        duration: 20,
        requestsPerSecond: 2
    },

    moderate: {
        duration: 20,
        requestsPerSecond: 10
    },

    heavy: {
        duration: 20,
        requestsPerSecond: 30
    },

    stress: {
        duration: 20,
        requestsPerSecond: 60
    }
};

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function sendRequest(workloadLevel) {

    const endpoint =
        endpoints[
            Math.floor(
                Math.random() * endpoints.length
            )
        ];

    try {

        const response = await fetch(
            BASE_URL + endpoint,
            {
                method: "GET",

                headers: {
                    "X-Workload-Level":
                        workloadLevel
                }
            }
        );

        return response.status;

    } catch (error) {

        console.log(
            `Request failed: ${error.message}`
        );

        return null;
    }
}

async function runWorkload(name) {

    const config = WORKLOADS[name];

    console.log("\n=================================");
    console.log(
        `Starting ${name.toUpperCase()} workload`
    );
    console.log(
        `Duration: ${config.duration} seconds`
    );
    console.log(
        `Target: ${config.requestsPerSecond} requests/second`
    );
    console.log("=================================\n");

    const interval =
        1000 / config.requestsPerSecond;

    const endTime =
        Date.now() +
        config.duration * 1000;

    let requestNumber = 0;

    while (Date.now() < endTime) {

        requestNumber++;

        sendRequest(name);

        if (
            requestNumber %
            config.requestsPerSecond === 0
        ) {

            console.log(
                `[${name}] Requests sent: ${requestNumber}`
            );
        }

        await sleep(interval);
    }

    console.log(
        `\n${name.toUpperCase()} workload completed.`
    );
}

async function main() {

    console.log("\n🚀 MarketHub Traffic Generator");
    console.log("--------------------------------");

    for (
        const workload of [
            "normal",
            "moderate",
            "heavy",
            "stress"
        ]
    ) {

        await runWorkload(workload);

        console.log(
            "\nWaiting before next workload...\n"
        );

        await sleep(3000);
    }

    console.log("\n=================================");
    console.log("✅ ALL WORKLOADS COMPLETED");
    console.log("=================================");
}

main();