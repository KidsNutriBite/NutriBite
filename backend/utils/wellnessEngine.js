/**
 * Child Wellness Intelligence Engine
 * Evaluates child stats, habits, and genetics to compute a wellness score (out of 100),
 * areas requiring attention (Red), closely monitor areas (Yellow), and strengths (Green).
 */
export const computeWellnessAnalysis = (profile) => {
    if (!profile) return null;

    const concerns = [];
    const monitor = [];
    const strengths = [];
    const recommendations = [];

    const age = Number(profile.age || 0);
    const height = Number(profile.height || 100);
    const weight = Number(profile.weight || 15);
    const waist = Number(profile.waistCircumference || 45);

    const prefs = profile.preferences || {};
    const family = profile.familyHistory || {};
    const conditions = profile.healthConditions || [];
    const premature = profile.prematureBirth || { isPremature: false, weeksPremature: 0 };

    // 1. BMI Calculation
    const heightM = height / 100;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));

    if (bmi < 14.0) {
        concerns.push({
            issue: 'Underweight Risk (Low BMI)',
            whyItMatters: 'A child weight below the normal range for height indicates insufficient energy intake relative to growth needs.',
            healthImpact: 'Can trigger physical fatigue, developmental slowdowns, and weakened immune defense.',
            priority: 'High',
            solutionKey: 'nutrition'
        });
    } else if (bmi >= 22.0) {
        concerns.push({
            issue: 'Overweight Risk (High BMI)',
            whyItMatters: 'Higher fat percentage places physical strain on the child\'s musculoskeletal joints and early cardiovascular system.',
            healthImpact: 'Elevates risks of early insulin resistance, childhood hypertension, and joint stiffness.',
            priority: 'High',
            solutionKey: 'nutrition'
        });
    } else {
        strengths.push({
            strength: 'Healthy BMI Proportion',
            benefit: 'Supports healthy metabolism, ensures light load on skeletal joints, and indicates balanced daily energy intake.',
            recommendation: 'Sustain balanced meals and perform height/weight tracking every 90 days.'
        });
    }

    // 2. Height vs Age
    let shortStature = false;
    if (age <= 3 && height < 75) shortStature = true;
    else if (age > 3 && age <= 5 && height < 90) shortStature = true;
    else if (age > 5 && age <= 10 && height < 110) shortStature = true;
    else if (age > 10 && height < 130) shortStature = true;

    if (shortStature) {
        monitor.push({
            issue: 'Short Stature vs Age Percentile',
            whyItMatters: 'Height is currently in the lower boundary relative to age milestones, which requires tracking.',
            healthImpact: 'Requires periodic growth velocity checking to rule out dietary gaps.',
            priority: 'Medium',
            solutionKey: 'growth'
        });
    } else {
        strengths.push({
            strength: 'Healthy Height Development',
            benefit: 'Indicates robust bone elongation and matches healthy genetic growth timelines.',
            recommendation: 'Provide adequate Calcium and Vitamin D sources like dairy or leafy greens.'
        });
    }

    // 3. Weight vs Age
    let weightVariance = false;
    if (age <= 3 && (weight < 9 || weight > 18)) weightVariance = true;
    else if (age > 3 && age <= 5 && (weight < 12 || weight > 25)) weightVariance = true;
    else if (age > 5 && age <= 10 && (weight < 18 || weight > 45)) weightVariance = true;
    else if (age > 10 && (weight < 30 || weight > 70)) weightVariance = true;

    if (weightVariance) {
        monitor.push({
            issue: 'Weight vs Age Variance',
            whyItMatters: 'Weight metrics show mild boundaries deviation from pediatric averages.',
            healthImpact: 'Requires minor daily calorie adjustments to match optimal growth target lines.',
            priority: 'Medium',
            solutionKey: 'growth'
        });
    } else {
        strengths.push({
            strength: 'Healthy Weight Range vs Age',
            benefit: 'Supports active outdoor play and matches standard pediatric percentile curves.',
            recommendation: 'Track daily meals with our log to ensure steady caloric balancing.'
        });
    }

    // 4. Sleep evaluation
    const sleepDur = Number(prefs.sleepDuration || 0);
    const sleepQual = prefs.sleepQuality || 'Average';

    if (sleepQual === 'Poor') {
        concerns.push({
            issue: 'Poor Sleep Quality',
            whyItMatters: 'Sleep disruptions restrict deep brain recovery phases and critical growth hormone release.',
            healthImpact: 'Triggers behavioral irritability, cognitive focus drops, and morning fatigue.',
            priority: 'High',
            solutionKey: 'sleep'
        });
    } else if (sleepQual === 'Average') {
        monitor.push({
            issue: 'Moderate Sleep Quality',
            whyItMatters: 'Inconsistent sleeping patterns can impact daytime attentiveness and physical energy.',
            healthImpact: 'Might cause minor energy slumps during school hours.',
            priority: 'Medium',
            solutionKey: 'sleep'
        });
    } else if (sleepDur >= 9 && sleepQual === 'Good') {
        strengths.push({
            strength: 'Excellent Rest & Sleep Habits',
            benefit: 'Optimizes growth hormone secretions, stabilizes morning mood, and boosts memory consolidation.',
            recommendation: 'Keep standard screen devices out of the child\'s bedroom at night.'
        });
    }

    if (sleepDur < 8 && sleepDur > 0) {
        concerns.push({
            issue: 'Short Sleep Duration',
            whyItMatters: 'Children need a minimum of 8-10 hours of sleep for proper physical restoration.',
            healthImpact: 'Lags in daily muscle recovery and lower immune resistance.',
            priority: 'High',
            solutionKey: 'sleep'
        });
    }

    // 5. Sports Activity Level
    const sportsLevel = profile.sportsActivityLevel || 'Moderately Active';
    if (sportsLevel === 'Sedentary') {
        concerns.push({
            issue: 'Sedentary Lifestyle',
            whyItMatters: 'Inactivity limits physical bone mineralization and reduces cardiorespiratory circulation.',
            healthImpact: 'Leads to sluggish metabolic rates, poor muscle tone, and higher long-term obesity risks.',
            priority: 'High',
            solutionKey: 'activity'
        });
    } else if (sportsLevel === 'Low Activity') {
        concerns.push({
            issue: 'Low Physical Activity',
            whyItMatters: 'Light play hours restrict cardiovascular stamina improvements and muscle adaptation.',
            healthImpact: 'Lower physical stamina and motor coordination development.',
            priority: 'High',
            solutionKey: 'activity'
        });
    } else if (sportsLevel === 'Moderately Active') {
        monitor.push({
            issue: 'Average Physical Activity Level',
            whyItMatters: 'Slightly low sport play intervals might miss cardiorespiratory conditioning opportunities.',
            healthImpact: 'Underutilized muscular development bounds.',
            priority: 'Medium',
            solutionKey: 'activity'
        });
    } else if (sportsLevel === 'Active' || sportsLevel === 'Very Active') {
        strengths.push({
            strength: 'Strong Physical Activity Habits',
            benefit: 'Builds high aerobic heart capacity, strengthens growing joints, and triggers endorphin mood lifters.',
            recommendation: 'Maintain regular sports activities and support hydration and protein recovery.'
        });
    }

    // 6. Food preferences & Vegetable Intake
    const eating = prefs.eatingHabits || 'average';
    const favVeg = prefs.favoriteVegetables || '';

    if (eating === 'poor') {
        concerns.push({
            issue: 'Poor Eating Quality',
            whyItMatters: 'Junk or high glycemic snacks cause regular insulin spikes and lack essential trace elements.',
            healthImpact: 'Triggers rapid blood glucose crashes, energy fatigue, and higher dental cavity risks.',
            priority: 'High',
            solutionKey: 'veggies'
        });
    } else if (eating === 'average') {
        monitor.push({
            issue: 'Potential Nutritional Gaps',
            whyItMatters: 'Average eating quality often misses key trace minerals like Zinc, Iron, or Magnesium.',
            healthImpact: 'Can manifest as mild dry skin flags or minor daily energy variations.',
            priority: 'Medium',
            solutionKey: 'veggies'
        });
    } else if (eating === 'good') {
        strengths.push({
            strength: 'Healthy Eating Quality',
            benefit: 'Delivers steady physical energy releases and builds a strong digestive gut microbiota.',
            recommendation: 'Continue home-cooked family plates and introduce new recipes to avoid pickiness.'
        });
    }

    if (!favVeg || favVeg.trim().length < 3) {
        concerns.push({
            issue: 'Poor Vegetable Intake',
            whyItMatters: 'Vegetables provide vital fibers and unique trace phytonutrients needed for digestion.',
            healthImpact: 'Higher constipation risks and lower resistance to winter seasonal colds.',
            priority: 'Medium',
            solutionKey: 'veggies'
        });
    }

    // 7. Water Intake
    const water = Number(prefs.waterIntake || 0);
    if (water < 1000 && water > 0) {
        concerns.push({
            issue: 'Low Daily Water Intake',
            whyItMatters: 'Water is essential to coordinate cognitive signaling, lubricate joints, and clear metabolic wastes.',
            healthImpact: 'Recurring headaches, mild brain fog, and digestive constipation.',
            priority: 'Medium',
            solutionKey: 'water'
        });
    } else if (water >= 1500) {
        strengths.push({
            strength: 'Excellent Hydration Habits',
            benefit: 'Keeps kidneys running smoothly and maintains optimal alertness during physical play.',
            recommendation: 'Keep offering water bottles during playground hours and minimize juices.'
        });
    }

    // 8. Screen Time
    const screen = Number(prefs.screenTime || 0);
    if (screen > 2) {
        concerns.push({
            issue: 'High Daily Screen Time',
            whyItMatters: 'Extended screens keep children sitting inside and can trigger dry eye issues.',
            healthImpact: 'Digital eye fatigue, poor physical posture, and sleep onset delays.',
            priority: 'Medium',
            solutionKey: 'screen'
        });
    }

    // 9. Premature Birth
    if (premature.isPremature) {
        concerns.push({
            issue: 'Premature Birth Monitoring Needed',
            whyItMatters: `Child was born ${premature.weeksPremature || 0} weeks premature, which can lag normal growth velocity paths.`,
            healthImpact: 'Milestones and weight trends should be monitored closer than average guidelines.',
            priority: 'High',
            solutionKey: 'growth'
        });
    }

    // 10. Medical conditions
    if (conditions.length > 0) {
        concerns.push({
            issue: `Diagnosed Medical Concerns (${conditions.join(', ')})`,
            whyItMatters: 'Underlying health conditions mandate specific dietary adjustments and caution.',
            healthImpact: 'Higher risk of immune or respiratory flare-ups if nutrition is neglected.',
            priority: 'High',
            solutionKey: 'growth'
        });
    }

    // 11. Family History
    const hasGenetics = family.siblingConditions?.hasCondition || family.motherConditions?.hasCondition || family.fatherConditions?.hasCondition;
    if (hasGenetics) {
        monitor.push({
            issue: 'Hereditary Family Risk Factors',
            whyItMatters: 'Hereditary predispositions checked (Sibling/Mother/Father) can manifest in childhood indicators.',
            healthImpact: 'Elevates likelihood of pediatric lipid spikes or weight sensitivity.',
            priority: 'Medium',
            solutionKey: 'clinical'
        });
    }

    // Define recommendations template map
    const roadmaps = {
        sleep: {
            concern: 'Poor Sleep / Short Rest',
            solution: 'Personalized Wellness Guidance',
            expectedImprovement: 'Improved Sleep Habits',
            icon: '😴'
        },
        activity: {
            concern: 'Low Physical Activity',
            solution: 'Growth Monitoring + Recommendations',
            expectedImprovement: 'Improved Fitness Levels',
            icon: '🏃'
        },
        veggies: {
            concern: 'Poor Vegetable Intake',
            solution: 'AI Meal Planner',
            expectedImprovement: 'Improved Nutritional Balance',
            icon: '🥦'
        },
        nutrition: {
            concern: 'BMI Metric Warnings',
            solution: 'AI Meal Planner',
            expectedImprovement: 'Balanced BMI Proportions',
            icon: '⚖️'
        },
        growth: {
            concern: 'Growth & Stature Plateaus',
            solution: 'Growth Monitoring + Recommendations',
            expectedImprovement: 'Standard Growth Percentiles',
            icon: '📈'
        },
        water: {
            concern: 'Low Fluid Hydration',
            solution: 'AI Food & Hydration Tracker',
            expectedImprovement: 'Consistent Optimal Hydration',
            icon: '💧'
        },
        screen: {
            concern: 'Excessive Digital Screen Time',
            solution: 'Personalized Wellness Guidance',
            expectedImprovement: 'Reduced Screen Dependence',
            icon: '📺'
        },
        clinical: {
            concern: 'Hereditary Predispositions',
            solution: 'Growth Monitoring + Recommendations',
            expectedImprovement: 'Clinical Growth Integrity',
            icon: '🧬'
        }
    };

    // Calculate score: starts at 100.
    // High concerns subtract 8, Medium subtract 4, Low/Monitor subtract 2
    let score = 100;
    concerns.forEach(c => {
        if (c.priority === 'High') score -= 8;
        else score -= 4;
    });
    monitor.forEach(m => {
        score -= 2;
    });
    if (score < 20) score = 20; // Bound score at minimum 20

    // Construct recommendations list
    const addedRecKeys = new Set();
    concerns.forEach(c => {
        const key = c.solutionKey;
        if (key && roadmaps[key] && !addedRecKeys.has(key)) {
            recommendations.push(roadmaps[key]);
            addedRecKeys.add(key);
        }
    });
    monitor.forEach(m => {
        const key = m.solutionKey;
        if (key && roadmaps[key] && !addedRecKeys.has(key)) {
            recommendations.push(roadmaps[key]);
            addedRecKeys.add(key);
        }
    });

    // Ensure we have default recommendations if none flagged
    if (recommendations.length === 0) {
        recommendations.push(roadmaps.veggies);
        recommendations.push(roadmaps.activity);
        recommendations.push(roadmaps.sleep);
    }

    return {
        score,
        concerns,
        monitor,
        strengths,
        recommendations
    };
};
