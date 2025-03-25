import { NextResponse } from 'next/server';
import { baiduApi } from '@/services/baiduApi';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const result = await baiduApi.textCensor(text);

    // 处理百度API返回结果
    return NextResponse.json({
      status: result.conclusionType === 1 ? 'approved' : 'rejected',
      reason: result.data?.[0]?.msg || result.conclusion
    });
  } catch (error) {
    console.error('文本审核失败:', error);
    return NextResponse.json(
      { error: '审核请求失败' },
      { status: 500 }
    );
  }
} 