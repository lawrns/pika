#!/bin/bash

# Fix DashboardOverviewPage
sed -i '/import type Transaction/d' src/components/pages/DashboardOverviewPage.tsx
sed -i '/updateBalance,/d' src/components/pages/DashboardOverviewPage.tsx

# Fix WalletPage - remove the entire unused import line
sed -i '/import.*QRCode.*qrcode/d' src/components/pages/WalletPage.tsx

# Fix TransactionList
sed -i '/useAppStore/d' src/components/transactions/TransactionList.tsx
sed -i '2d' src/components/transactions/TransactionList.tsx

# Fix SettingsPage
sed -i '385s/checked={settings\[key\] as unknown as boolean}/checked={(settings as Record<string, boolean>)[key]}/' src/components/pages/SettingsPage.tsx

# Fix QRPage
sed -i '93s/if (result.data) {/if (result.data \&\& result.data.expiresAt) {/' src/components/pages/QRPage.tsx

echo "Final fixes applied!"
