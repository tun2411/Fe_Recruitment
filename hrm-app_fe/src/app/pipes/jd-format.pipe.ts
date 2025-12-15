import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'jdFormat',
  standalone: true,
})
export class JdFormatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    let html = value;

    // Chuẩn hóa line ending
    html = html.replace(/\r\n/g, '\n');

    // Escape basic HTML để tránh người dùng chèn thẻ nguy hiểm
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tách theo dòng để xử lý dễ hơn
    const lines = html.split('\n');
    const processedLines: string[] = [];

    for (let rawLine of lines) {
      // Tự triển khai trimEnd để không phụ thuộc ES2019
      const line = rawLine.replace(/[ \t]+$/, '');

      if (!line.trim()) {
        processedLines.push('');
        continue;
      }

      // Tiêu đề lớn
      const headingRegex =
        /^(Mô tả công việc|Yêu cầu công việc|Yêu cầu|Quyền lợi|Phúc lợi|Mô tả|Thông tin thêm)/i;
      if (headingRegex.test(line)) {
        const headingText = line.replace(headingRegex, '$1');
        processedLines.push(
          `<h2 class="jd-section-title">${headingText}</h2>`
        );
        continue;
      }

      // Sub-bullet (thụt lề >= 4 spaces)
      if (/^\s{4,}[•\-o\d]/.test(rawLine)) {
        const bulletText = rawLine.trim().replace(/^[•·\-o]\s*/, '');
        processedLines.push(`<li class="jd-sub-bullet">${bulletText}</li>`);
        continue;
      }

      // Bullet: số thứ tự 1. 2. 3.
      if (/^\d+\.\s+/.test(line)) {
        const bulletText = line.replace(/^\d+\.\s+/, '');
        processedLines.push(`<li class="jd-ol-item">${bulletText}</li>`);
        continue;
      }

      // Bullet: • - o
      if (/^[•·\-o]\s+/.test(line)) {
        const bulletText = line.replace(/^[•·\-o]\s+/, '');
        processedLines.push(`<li class="jd-ul-item">${bulletText}</li>`);
        continue;
      }

      // Dòng thường → paragraph
      processedLines.push(`<p>${line}</p>`);
    }

    html = processedLines.join('\n');

    // Gộp các li liên tiếp thành ul/ol
    // Ordered list
    html = html.replace(
      /(?:\n?)(<li class="jd-ol-item">[\s\S]*?<\/li>)+/g,
      (match) => `<ol>${match.replace(/\n/g, '')}</ol>`
    );

    // Unordered list
    html = html.replace(
      /(?:\n?)(<li class="jd-ul-item">[\s\S]*?<\/li>)+/g,
      (match) => `<ul>${match.replace(/\n/g, '')}</ul>`
    );

    // Sub bullets: wrap nếu đứng một mình
    html = html.replace(
      /(<li class="jd-sub-bullet">[\s\S]*?<\/li>)/g,
      '<ul class="jd-sub-list">$1</ul>'
    );

    // Bold cho các cụm từ hay bôi đậm trong JD VN
    html = html.replace(
      /(Học vấn|Kinh nghiệm|Kỹ năng|Ngoại ngữ|Quyền lợi|Mức lương|Địa điểm làm việc|Địa điểm):/gi,
      '<strong>$1:</strong>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}


