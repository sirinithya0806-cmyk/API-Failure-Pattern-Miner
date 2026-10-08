const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const PORT = 3000;
const logFile = "api_logs.csv";

// =====================================================
// CSV LOG FILE
// =====================================================

if (!fs.existsSync(logFile)) {
    fs.writeFileSync(
        logFile,
        "timestamp,method,endpoint,status_code,response_time_ms,request_rate,cpu_percent,memory_mb,workload_level\n"
    );
}

// =====================================================
// TELEMETRY
// =====================================================

let requestCount = 0;
let currentRequestRate = 0;

let previousCpuUsage = process.cpuUsage();
let previousTime = Date.now();
let latestCpuPercent = 0;

// Calculate request rate every second
setInterval(() => {
    currentRequestRate = requestCount;
    requestCount = 0;
}, 1000);

// Calculate CPU usage every second
setInterval(() => {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = Date.now();

    const cpuTime =
        (currentCpuUsage.user - previousCpuUsage.user) +
        (currentCpuUsage.system - previousCpuUsage.system);

    const elapsedTime =
        (currentTime - previousTime) * 1000;

    const cpuCores = os.cpus().length;

    let cpuPercent = 0;

    if (elapsedTime > 0) {
        cpuPercent =
            (cpuTime / elapsedTime / cpuCores) * 100;
    }

    latestCpuPercent = Number(cpuPercent.toFixed(2));

    previousCpuUsage = currentCpuUsage;
    previousTime = currentTime;
}, 1000);

// =====================================================
// API LOGGING MIDDLEWARE
// =====================================================

app.use((req, res, next) => {
    const startTime = Date.now();

    requestCount++;

    res.on("finish", () => {
        const responseTime = Date.now() - startTime;

        const timestamp = new Date().toISOString();

        const memory =
            process.memoryUsage().rss / (1024 * 1024);

        const memoryMB = Number(memory.toFixed(2));

        const workloadLevel =
            req.headers["x-workload-level"] || "unknown";

        const logLine =
            `${timestamp},` +
            `${req.method},` +
            `${req.originalUrl},` +
            `${res.statusCode},` +
            `${responseTime},` +
            `${currentRequestRate},` +
            `${latestCpuPercent},` +
            `${memoryMB},` +
            `${workloadLevel}\n`;

        fs.appendFileSync(logFile, logLine);

        console.log(
            `[API LOG] ${timestamp} | ` +
            `${req.method} | ` +
            `${req.originalUrl} | ` +
            `${res.statusCode} | ` +
            `${responseTime} ms | ` +
            `Rate: ${currentRequestRate}/s | ` +
            `CPU: ${latestCpuPercent}% | ` +
            `Memory: ${memoryMB} MB | ` +
            `Workload: ${workloadLevel}`
        );
    });

    next();
});

// =====================================================
// MARKETPLACE DATA
// =====================================================

const products = [
    {
        id: 1,
        name: "Laptop",
        category: "Electronics",
        price: 55000,
        sellerId: 101
    },
    {
        id: 2,
        name: "Wireless Mouse",
        category: "Electronics",
        price: 1200,
        sellerId: 102
    },
    {
        id: 3,
        name: "Backpack",
        category: "Fashion",
        price: 1800,
        sellerId: 103
    }
];

const users = [
    {
        id: 1,
        name: "Rahul",
        email: "rahul@example.com"
    },
    {
        id: 2,
        name: "Priya",
        email: "priya@example.com"
    },
    {
        id: 3,
        name: "Arjun",
        email: "arjun@example.com"
    }
];

const sellers = [
    {
        id: 101,
        name: "TechWorld",
        category: "Electronics"
    },
    {
        id: 102,
        name: "GadgetStore",
        category: "Electronics"
    },
    {
        id: 103,
        name: "FashionHub",
        category: "Fashion"
    }
];

// =====================================================
// CART
// =====================================================

const carts = {};

// =====================================================
// ORDERS
// =====================================================

const orders = [];

let nextOrderId = 1001;

// =====================================================
// INVENTORY
// =====================================================

const inventory = {
    1: {
        productId: 1,
        productName: "Laptop",
        stock: 20
    },

    2: {
        productId: 2,
        productName: "Wireless Mouse",
        stock: 50
    },

    3: {
        productId: 3,
        productName: "Backpack",
        stock: 30
    }
};

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "MarketHub API is running",
        project: "API Failure Pattern Miner"
    });
});

// =====================================================
// PRODUCTS
// =====================================================

app.get("/api/products", (req, res) => {
    res.json({
        success: true,
        products: products
    });
});

app.get("/api/products/:id", (req, res) => {
    const productId = Number(req.params.id);

    const product = products.find(
        p => p.id === productId
    );

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    res.json({
        success: true,
        product: product
    });
});

// =====================================================
// USERS
// =====================================================

app.get("/api/users", (req, res) => {
    res.json({
        success: true,
        users: users
    });
});

app.get("/api/users/:id", (req, res) => {
    const userId = Number(req.params.id);

    const user = users.find(
        u => u.id === userId
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.json({
        success: true,
        user: user
    });
});

// =====================================================
// SELLERS
// =====================================================

app.get("/api/sellers", (req, res) => {
    res.json({
        success: true,
        sellers: sellers
    });
});

app.get("/api/sellers/:id", (req, res) => {
    const sellerId = Number(req.params.id);

    const seller = sellers.find(
        s => s.id === sellerId
    );

    if (!seller) {
        return res.status(404).json({
            success: false,
            message: "Seller not found"
        });
    }

    res.json({
        success: true,
        seller: seller
    });
});

// =====================================================
// CART
// =====================================================

app.get("/api/cart/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    if (!carts[userId]) {
        carts[userId] = [];
    }

    res.json({
        success: true,
        userId: userId,
        cart: carts[userId]
    });
});

app.post("/api/cart/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    const {
        productId,
        quantity
    } = req.body;

    const product = products.find(
        p => p.id === Number(productId)
    );

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    if (!carts[userId]) {
        carts[userId] = [];
    }

    carts[userId].push({
        productId: product.id,
        productName: product.name,
        quantity: quantity
    });

    res.status(201).json({
        success: true,
        message: "Product added to cart",
        cart: carts[userId]
    });
});

app.delete(
    "/api/cart/:userId/:productId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const productId =
            Number(req.params.productId);

        if (!carts[userId]) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        carts[userId] =
            carts[userId].filter(
                item =>
                    item.productId !== productId
            );

        res.json({
            success: true,
            message: "Product removed",
            cart: carts[userId]
        });
    }
);

// =====================================================
// ORDERS
// =====================================================

app.get("/api/orders", (req, res) => {
    res.json({
        success: true,
        orders: orders
    });
});

app.get(
    "/api/orders/user/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const userOrders =
            orders.filter(
                order =>
                    order.userId === userId
            );

        res.json({
            success: true,
            orders: userOrders
        });
    }
);

app.post(
    "/api/orders/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const cart =
            carts[userId] || [];

        if (cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        let total = 0;

        cart.forEach(item => {

            const product =
                products.find(
                    p =>
                        p.id === item.productId
                );

            if (product) {
                total +=
                    product.price *
                    item.quantity;
            }
        });

        const order = {
            orderId: nextOrderId++,
            userId: userId,
            items: cart,
            total: total,
            status: "PLACED"
        };

        orders.push(order);

        carts[userId] = [];

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: order
        });
    }
);

// =====================================================
// INVENTORY
// =====================================================

app.get("/api/inventory", (req, res) => {

    const inventoryList =
        Object.values(inventory)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                stock: item.stock,
                status:
                    item.stock > 0
                        ? "IN_STOCK"
                        : "OUT_OF_STOCK"
            }));

    res.json({
        success: true,
        inventory: inventoryList
    });
});

app.get(
    "/api/inventory/:productId",
    (req, res) => {

        const productId =
            Number(req.params.productId);

        const item =
            inventory[productId];

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        res.json({
            success: true,
            inventory: {
                ...item,
                status:
                    item.stock > 0
                        ? "IN_STOCK"
                        : "OUT_OF_STOCK"
            }
        });
    }
);

app.put(
    "/api/inventory/:productId",
    (req, res) => {

        const productId =
            Number(req.params.productId);

        const item =
            inventory[productId];

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        const {
            stock
        } = req.body;

        item.stock = Number(stock);

        res.json({
            success: true,
            message: "Inventory updated",
            inventory: item
        });
    }
);

// =====================================================
// SEARCH API
// =====================================================
//
// This represents a heavier marketplace operation.
// It performs repeated product matching and scoring.
// The processing is measured by our telemetry.
// =====================================================

app.get("/api/search", (req, res) => {

    const query =
        String(req.query.q || "")
            .toLowerCase();

    const workloadLevel =
        req.headers["x-workload-level"] ||
        "unknown";

    let iterations = 10000;

    if (workloadLevel === "moderate") {
        iterations = 50000;
    }

    if (workloadLevel === "heavy") {
        iterations = 200000;
    }

    if (workloadLevel === "stress") {
        iterations = 500000;
    }

    let score = 0;
    let matchedProducts = [];

    for (let i = 0; i < iterations; i++) {

        for (const product of products) {

            const text =
                (
                    product.name +
                    " " +
                    product.category
                ).toLowerCase();

            if (
                query === "" ||
                text.includes(query)
            ) {
                score +=
                    product.price % 97;

                if (i === 0) {
                    matchedProducts.push(
                        product
                    );
                }
            }
        }
    }

    res.json({
        success: true,
        query: query,
        results: matchedProducts,
        searchScore: score
    });
});

// =====================================================
// SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(
        `MarketHub server running at http://localhost:${PORT}`
    );

    console.log(
        "API Failure Pattern Miner environment ready."
    );
});