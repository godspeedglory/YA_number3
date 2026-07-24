const fs = require('fs');
const { execSync } = require('child_process');
const levels = {
    '#ebedf0': 0,
    '#9be9a8': 1,
    '#40c463': 2,
    '#30a14e': 3,
    '#216e39': 4,
};
const commits = {
    0: 0,
    1: 1,
    2: 3,
    3: 6,
    4: 11,
};

function getStart() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 1);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
}

function getCols(start, row) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay();
    const days = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil((days + 1) / 7);
    return row <= todayDay ? weeks : weeks - 1;
}

function getDate(start, row, col) {
    const date = new Date(start);
    date.setDate(date.getDate() + (col * 7) + row);
    return date;
}

function makeCommit(date, count) {
    const ts = date.toISOString();
    for (let i = 0; i < count; i++) {
        execSync(`git commit --allow-empty -m "Activity commit ${ts}"`, {
            env: {
                ...process.env,
                GIT_AUTHOR_DATE: ts,
                GIT_COMMITTER_DATE: ts,
            },
            stdio: 'pipe',
        });
    }
}

function main() {

    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('нужно: node solution.js test.json');
        process.exit(1);
    }

    const file = args[0];
    if (!fs.existsSync(file)) {
        console.log(`файл ${file} не найден`);
        process.exit(1);
    }

    const colors = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(colors)) {
        console.log('нужен массив цветов');
        process.exit(1);
    }

    try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
        console.log('не git репозиторий');
        process.exit(1);
    }

    const start = getStart();
    console.log(`начало: ${start.toISOString().split('T')[0]}`);
    console.log(`ячеек: ${colors.length}`);
    let total = 0;
    let idx = 0;
    const now = new Date();
    for (let row = 0; row < 7; row++) {
        const cols = getCols(start, row);

        for (let col = 0; col < cols; col++) {
            if (idx >= colors.length) break;

            const color = colors[idx];
            const level = levels[color];
            
            if (level !== undefined) {
                const count = commits[level];
                
                if (count > 0) {
                    const date = getDate(start, row, col);
                    
                    if (date <= now) {
                        makeCommit(date, count);
                        total += count;
                    }
                }
            }

            idx++;
        }
    }
    console.log(`сделано ${total} коммитов`);
    console.log('теперь: git push')
}

if (require.main === module) {
    main();
}