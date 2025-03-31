import https from 'https';
import qs from 'querystring';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.NEXT_PUBLIC_BAIDU_API_KEY;
const SECRET_KEY = process.env.NEXT_PUBLIC_BAIDU_SECRET_KEY;

interface BaiduAuthResponse {
  access_token: string;
  expires_in: number;
}

class BaiduApiService {
  private static instance: BaiduApiService;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  private constructor() {}

  public static getInstance(): BaiduApiService {
    if (!BaiduApiService.instance) {
      BaiduApiService.instance = new BaiduApiService();
    }
    return BaiduApiService.instance;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const params = qs.stringify({
      'grant_type': 'client_credentials',
      'client_id': API_KEY,
      'client_secret': SECRET_KEY
    });

    try {
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?${params}`,
        { method: 'GET' }
      );
      
      const data = await response.json() as BaiduAuthResponse;
      this.accessToken = data.access_token;
      this.tokenExpireTime = Date.now() + (data.expires_in - 60) * 1000; // 提前1分钟过期
      return this.accessToken;
    } catch (error) {
      console.error('获取百度API访问令牌失败:', error);
      throw new Error('获取访问令牌失败');
    }
  }

  public async textCensor(text: string) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: qs.stringify({ text })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('文本审核失败:', error);
      throw new Error('文本审核失败');
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    try {
      // 创建临时文件
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      const tempFilePath = path.join(tempDir, `temp-${Date.now()}.jpg`);
      
      // 将 File 对象转换为 Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 写入临时文件
      fs.writeFileSync(tempFilePath, buffer);
      
      // 读取文件并转换为 base64
      const fileData = fs.readFileSync(tempFilePath);
      const base64 = fileData.toString('base64');
      
      // 删除临时文件
      fs.unlinkSync(tempFilePath);
      
      return base64;
    } catch (error) {
      console.error('文件转换失败:', error);
      throw new Error('文件转换失败');
    }
  }

  public async imageCensor(file: File) {
    try {
      const accessToken = await this.getAccessToken();
      const base64 = await this.fileToBase64(file);

      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: qs.stringify({ image: base64 })
        }
      );

      const result = await response.json();
      if (result.error_code) {
        throw new Error(result.error_msg || '图片审核失败');
      }
      return result;
    } catch (error) {
      console.error('图片审核失败:', error);
      throw new Error('图片审核失败');
    }
  }
}

export default BaiduApiService;