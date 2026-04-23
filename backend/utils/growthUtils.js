// Utility functions for growth calculations

export const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return parseFloat(bmi.toFixed(1));
};

export const calculateAgeInMonths = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();

    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();

    // Adjust if not full month yet
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }

    return months > 0 ? months : 0;
};

// Simplified static percentile mapping for demo purposes
// In production, this would use WHO/CDC growth charts data
export const calculatePercentileAndRisk = (ageInMonths, bmi) => {
    // Basic heuristics for demo (these are approximations)
    // 50th percentile BMI roughly follows:
    // 2-5 yrs: ~15-16
    // 5-10 yrs: ~16-17
    // 10-15 yrs: ~17-20

    let riskStatus = 'normal';
    let percentile = 50;

    // Define approximate ranges for "Healthy Weight" (5th to 85th percentile)
    // Map: age_range_start -> [min_healthy_bmi, max_healthy_bmi]
    const bmiRanges = [
        { maxAge: 24, min: 14.8, max: 18.2 },  // 0-2 yrs
        { maxAge: 60, min: 13.8, max: 16.8 },  // 2-5 yrs
        { maxAge: 120, min: 13.5, max: 18.5 }, // 5-10 yrs
        { maxAge: 180, min: 14.5, max: 23.0 }, // 10-15 yrs
        { maxAge: 216, min: 16.5, max: 25.0 }  // 15-18 yrs
    ];

    const range = bmiRanges.find(r => ageInMonths <= r.maxAge) || bmiRanges[bmiRanges.length - 1];

    if (bmi < range.min) {
        riskStatus = 'underweight';
        percentile = 3; // < 5th
    } else if (bmi > range.max) {
        // Check if obese (> 95th percentile, approx +2-3 units above max healthy)
        if (bmi > range.max + 3) {
            riskStatus = 'obese';
            percentile = 97;
        } else {
            riskStatus = 'overweight';
            percentile = 90;
        }
    } else {
        // Interpolate percentile between 5 and 85 based on position in range
        const totalRange = range.max - range.min;
        const position = bmi - range.min;
        const percentageOfRange = position / totalRange;

        // Map 0.0-1.0 to 5-85
        percentile = 5 + (percentageOfRange * 80);
        riskStatus = 'normal';
    }

    return {
        percentile: parseFloat(percentile.toFixed(1)),
        riskStatus
    };
};
