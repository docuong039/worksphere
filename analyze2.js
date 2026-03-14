const fs = require('fs');
const blocks = JSON.parse(fs.readFileSync('C:/Users/Admin/Documents/worksphere/catch_blocks.json', 'utf8'));
const problematic = blocks.filter(b => {
    // If it's a backend file, it usually returns NextResponse or throw
    const snip = b.snippet.toLowerCase();
    
    // Front-end UI files check
    const isFrontend = b.file.includes('components') || b.file.includes('(frontend)');
    
    if (isFrontend) {
        // Look for bad patterns
        const hasToast = snip.includes('toast.') || snip.includes('toast(');
        const hasSetError = snip.includes('seterror(');
        const hasConsoleErrorOnly = snip.includes('console.error');
        
        // If it lacks specific toast/setError, or is generic
        if (!hasToast && !hasSetError) return true;
        if (snip.includes('có lỗi xảy ra') || snip.includes('lỗi xảy ra') || snip.includes('đã xảy ra lỗi')) return true;
        if (snip.includes('lỗi kết nối')) return true;
        if (snip.includes('có lỗi') && !snip.includes('||')) return true;
        return false;
    }
    
    return false;
});

const report = problematic.map(b => b.file + ':' + b.line + '\n' + b.snippet + '\n-------------------');
fs.writeFileSync('C:/Users/Admin/Documents/worksphere/problem_blocks.txt', report.join('\n'));
console.log('Found ' + problematic.length + ' problematic blocks');
