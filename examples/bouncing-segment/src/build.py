from pathlib import Path

src = Path(__file__).resolve().parent
css = (src / 'style.css').read_text() + '\n' + (src / 'extras.css').read_text()
scripts = ['math.js', 'main.js', 'extras.js', 'download.js']
code = '\n'.join('<script data-offline>\n' + (src / n).read_text() + '\n</script>' for n in scripts)
html = (src / 'shell.html').read_text().replace('{{STYLES}}', css).replace('{{EXTRAS}}', (src / 'extras.html').read_text()).replace('{{SCRIPTS}}', code)
target = src.parent / 'index.html'
target.write_text(html, encoding='utf-8')
print('Built', target.name, target.stat().st_size, 'bytes')
