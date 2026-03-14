const fs = require('fs');
const path = require('path');

function findCatchBlocks(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'public' || file.endsWith('.json')) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(findCatchBlocks(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('catch (')) {
                    const nextLines = lines.slice(i, i + 10).join('\n');
                    results.push({ file: fullPath, line: i + 1, snippet: nextLines.substring(0, 300) });
                }
            }
        }
    }
    return results;
}

const blocks = findCatchBlocks('C:/Users/Admin/Documents/worksphere/src');
fs.writeFileSync('C:/Users/Admin/Documents/worksphere/catch_blocks.json', JSON.stringify(blocks, null, 2));
console.log('Found ' + blocks.length + ' catch blocks');
