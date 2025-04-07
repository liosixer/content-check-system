import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'assets', 'text_check.csv');

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(filePath, content, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存规则失败:', error);
    return NextResponse.json(
      { error: '保存规则失败' },
      { status: 500 }
    );
  }
} 