import { NextResponse } from 'next/server';
import { baiduApi } from '@/services/baiduApi';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: '未找到图片' },
        { status: 400 }
      );
    }

    const result = await baiduApi.imageCensor(image);

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
  }
}