
export const calculateCommission = (category: string, amount: number) => {
    // Requirements:
    // Food/Fashion: 2.5%–5% -> Let's go with 5% for now as strict requirement says "~5%".
    // Electronics/Tech: up to 8% -> Let's go with 8%.
    // Plus ₦100 flat fee.

    let percentage = 0.05; // Default 5%

    if (!category) {
        percentage = 0.05;
    } else {
        const catStr = String(category); // Safety cast
        const lowerCat = catStr.toLowerCase();
        if (lowerCat.includes("food") || lowerCat.includes("fashion") || lowerCat.includes("clothing")) {
            percentage = 0.05;
        } else if (lowerCat.includes("tech") || lowerCat.includes("electronic") || lowerCat.includes("gadget")) {
            percentage = 0.08;
        }
    }

    // Base calculation
    const percentageFee = Math.round(amount * percentage); // Amount is expected to be in Naira
    const flatFee = 100;
    
    let totalCommission = percentageFee + flatFee;

    // RULE: Minimum Platform Fee Enforced (2.5% + 100)
    // Even if category is 0% (unlikely) or low, we must ensure sustainability.
    const minFee = Math.round(amount * 0.025) + 100;
    
    if (totalCommission < minFee) {
        totalCommission = minFee;
    }

    // Ensure we don't take more than the total amount (safeguard)
    if (totalCommission > amount) {
        return amount;
    }

    return totalCommission;
};
