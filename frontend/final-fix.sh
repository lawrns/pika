#!/bin/bash

# Fix unused imports
sed -i "s/, useEffect//" src/components/pages/DashboardOverviewPage.tsx
sed -i "/import type Transaction/d" src/components/pages/DashboardOverviewPage.tsx
sed -i "/updateBalance,/d" src/components/pages/DashboardOverviewPage.tsx

# Fix QRPage
sed -i '93s/if (result.data) {/if (result.data \&\& result.data.expiresAt) {/' src/components/pages/QRPage.tsx

# Fix SettingsPage
sed -i "/function formatCurrency/d" src/components/pages/SettingsPage.tsx

# Fix TransactionsPage
sed -i "/MoreVertical,/d" src/components/pages/TransactionsPage.tsx

# Fix WalletPage
sed -i "/import.*qrCode/d" src/components/pages/WalletPage.tsx

# Fix api.ts
sed -i 's/, dateRange?: {/, _dateRange?: {/' src/lib/api.ts

# Fix TransactionList
sed -i 's/from '"'"'@\/store'"'"'/from '"'"'@\/store'"'"'\nimport type { Transaction } from '"'"'@\/store\/types'"'"'/' src/components/transactions/TransactionList.tsx
sed -i "/Transaction,/d" src/components/transactions/TransactionList.tsx

echo "Fixes applied!"
