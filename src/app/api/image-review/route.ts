import { NextResponse } from 'next/server';
import { baiduApi } from '@/services/baiduApi';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到图片' },
        { status: 400 }
      );
    }

    // 创建临时文件路径
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${uuidv4()}-${file.name}`);

    // 将文件写入临时路径
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // 调用 imageCensor 方法并传入文件路径
    const result = await baiduApi.imageCensor(tempFilePath);

    // 处理百度API返回结果
    return NextResponse.json({
      status: result.conclusionType === 1 ? 'approved' : 'rejected',
      reason: result.data?.[0]?.msg || result.conclusion
    });
  } catch (error) {
    console.error('图片审核失败:', error);
    return NextResponse.json(
      { error: '审核请求失败' },
      { status: 500 }
    );
  } finally {
    // // 清理临时文件
    // if (tempFilePath) {
    //   fs.unlinkSync(tempFilePath);
    // }
  }
}