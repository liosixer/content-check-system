import axios from 'axios';
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
      const response = await axios.get<BaiduAuthResponse>(
        `https://aip.baidubce.com/oauth/2.0/token?${params}`
      );
      
      const data = response.data;
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
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`,
        qs.stringify({ text }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('文本审核失败:', error);
      throw new Error('文本审核失败');
    }
  }

  private async fileToBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const base64 = data.toString('base64');
          resolve(base64);
        }
      });
    });
  }

  public async imageCensor(imagePath: string) {
    
  
    try {
      const accessToken = await this.getAccessToken();
      const base64 = await this.fileToBase64(imagePath);
  
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${accessToken}`,
        qs.stringify({ image: base64 }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          responseType: 'json', // 确保返回值为 JSON 格式
          timeout: 10000, // 设置超时时间为 10 秒
        }
      );
  
      if (response.data.error_code) {
        // 如果返回错误码，抛出详细错误信息
        throw new Error(`图片审核失败: ${response.data.error_msg}`);
      }
  
      return response.data;
    } catch (error: any) {
      let errorMessage = '图片审核失败';
      if (error.response) {
        // 捕获非 JSON 响应或错误内容
        errorMessage += `: ${error.response.data || error.response.statusText}`;
      } else if (error.request) {
        // 请求未收到响应
        errorMessage += ': 请求无响应，请检查网络连接';
      } else {
        // 其他错误
        errorMessage += `: ${error.message}`;
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export const baiduApi = BaiduApiService.getInstance();