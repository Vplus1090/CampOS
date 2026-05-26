export const gradePointMap = {
    "A+": 10,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C+": 6,
    "C": 5,
    "D": 4,
    "F": 0,
};

export function calculateSGPA(subjects) {
    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
        const credits = parseFloat(subject.credits);
        if (credits > 0) {
            const gp = subject.gradePoints ?? gradePointMap[subject.grade] ?? 0;
            totalPoints += gp * credits;
            totalCredits += credits;
        }
    });

    return totalCredits === 0 ? null : totalPoints / totalCredits;
}

export function calculateCGPA(semesters) {
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(({ sgpa, credits }) => {
        const s = parseFloat(sgpa);
        const c = parseFloat(credits);
        if (!isNaN(s) && !isNaN(c) && c > 0) {
            totalPoints += s * c;
            totalCredits += c;
        }
    });

    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
}

export function calculateRequiredSGPA(targetCgpa, pastSemesters, nextCredits) {
    const t = parseFloat(targetCgpa);
    const n = parseFloat(nextCredits);
    if (isNaN(t) || isNaN(n) || n <= 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    pastSemesters.forEach(({ sgpa, credits }) => {
        const s = parseFloat(sgpa);
        const c = parseFloat(credits);
        if (!isNaN(s) && !isNaN(c)) {
            totalPoints += s * c;
            totalCredits += c;
        }
    });

    return (t * (totalCredits + n) - totalPoints) / n;
}

export function calculateClassesNeeded(attended, total, goal) {
    const a = parseInt(attended) || 0;
    const t = parseInt(total) || 0;
    const g = parseInt(goal) || 75;
    if (t === 0 || g >= 100) return 0;
    const needed = Math.ceil((g * t - 100 * a) / (100 - g));
    return Math.max(0, needed);
}

export function calculateClassesCanMiss(attended, total, goal) {
    const a = parseInt(attended) || 0;
    const t = parseInt(total) || 0;
    const g = parseInt(goal) || 75;
    if (t === 0 || g <= 0) return 0;
    const canMiss = Math.floor((100 * a - g * t) / g);
    return Math.max(0, canMiss);
}
