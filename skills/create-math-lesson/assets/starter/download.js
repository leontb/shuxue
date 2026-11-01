(function () {
  'use strict';
  document.getElementById('download-html').addEventListener('click', () => {
    const status = document.getElementById('download-status');
    try {
      const owned = document.getElementById('courseware-app').cloneNode(true);
      for (const id of ['lesson-stage', 'lesson-nav', 'practice-list', 'download-status']) owned.querySelector('#' + id).innerHTML = '';
      // Use a detached document. Literal document-end tags inside JS can be
      // mistaken for insertion points by a hosting or preview HTML rewriter.
      const exported = document.implementation.createHTMLDocument(String(window.CoursewareLesson.title));
      exported.documentElement.lang = 'zh-CN';
      const charset = exported.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      exported.head.insertBefore(charset, exported.head.firstChild);
      const viewport = exported.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width,initial-scale=1';
      exported.head.appendChild(viewport);
      document.querySelectorAll('style[data-offline="style"]').forEach(style => exported.head.appendChild(exported.importNode(style, true)));
      exported.body.appendChild(exported.importNode(owned, true));
      document.querySelectorAll('script[data-offline="script"]').forEach(script => exported.body.appendChild(exported.importNode(script, true)));
      const html = '<' + '!doctype html>\n' + exported.documentElement.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = window.CoursewareLesson.downloadName || 'math-lesson.html';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      status.textContent = '已生成离线HTML；重新打开会从第1步开始。';
    } catch (error) {
      status.textContent = '未能自动下载。请使用交付包里的index.html。';
    }
  });
})();
