use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Initialize tracing
    println!("🌌 BitSwarp Matching Engine starting...");

    let app = Router::new()
        .route("/", get(root))
        .route("/order", post(place_order));

    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    println!("⚡ Matching Engine listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "BitSwarp Engine v0.1.0-alpha | Status: Online"
}

#[derive(Serialize, Deserialize, Debug)]
struct Order {
    pair: String,
    side: String,
    price: f64,
    amount: f64,
}

async fn place_order(Json(payload): Json<Order>) -> Json<serde_json::Value> {
    println!("📥 Received order: {:?}", payload);
    Json(serde_json::json!({
        "status": "received",
        "order_id": "bitswarp_tx_12345",
        "timestamp": 1770670000000u64
    }))
}
