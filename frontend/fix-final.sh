#!/bin/bash

# Fix TransactionsPage missing imports
sed -i '/import {/a\  ArrowLeftRight, FileText, Loader2, X,' src/components/pages/TransactionsPage.tsx

# Fix WalletPage unused import (just remove it since we're not using it)
sed -i '/import.*qrCode.*QRCode/d' src/components/pages/WalletPage.tsx

# Fix DashboardOverviewPage unused
sed -i '/Transaction,/d' src/components/pages/DashboardOverviewPage.tsx
sed -i '/updateBalance,/d' src/components/pages/DashboardOverviewPage.tsx

# Fix SettingsPage type error
sed -i 's/checked={(settings as Record<string, boolean>)/checked={settings[key] as unknown as boolean/' src/components/pages/SettingsPage.tsx

# Fix TransactionList
sed -i '/from '"'"'@\/store'"'"'/d' src/components/transactions/TransactionList.tsx
sed -i '1 i import { useAppStore } from '"'"'@\/store'"'"'\nimport type { Transaction } from '"'"'@\/store\/types'"'"'' src/components/transactions/TransactionList.tsx

# Fix QRPage
sed -i 's/if (result.data \&\& result.data.expiresAt) {/if (result.data) {\n                if (!result.data.expiresAt) return/' src/components/pages/QRPage.tsx

echo "All fixes applied!"
