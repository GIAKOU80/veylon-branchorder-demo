# BranchOrder · Replenishment

Standalone interactive demo based on the [Grayscale design in Paper](https://app.paper.design/file/01M6PTYXGATQZAJ0SWFSPFSRV1/p-1-0).

Submit the default request for eight Core hoodies as Branch. In Warehouse, reserve and dispatch five. Back in Branch, confirm receipt and see the three units that remain open. The alternative **Wait for all 8 units** keeps the request open with zero reserved. Inventory shows on-hand, reserved and free units separately.

This is a single-product request using fictional stock in memory. Refresh or reset restores the original scenario. Run `python -m http.server 8770` from the root. On Vercel use `main`, preset **Other**, the repository root and a blank Build Command. No environment variables are required.
