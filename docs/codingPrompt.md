任务1：学习并理解当前项目框架、代码结构、编写风格、规范、注释、命名。
- 在docs目录，是指导你完成开发帮助文档，过程中需要维护。
- 在学习并理解完所有项目内容后，给我反馈一个学习小结，以便是否可以开始项目代码及模块的开发。

任务2：
完成后端-管理侧功能模块的开发
- 后台登录页：采用响应式设计、沉浸式设计、自适应设计，界面风格以企业化管理软件风格为主，简约专业（后台主要是admin专员使用，默认用户名和密码：admin/admin123），界面参考上传的UI效果图风格完成开发。
- 后台主页：预留页面，后期开发完所有模块后再实现，本次任务不动代码。
- 用户管理：实现用户新增/删除/修改/分页（28条）等功能
开发限制：
- 后台管理采用layui开发后台经典管理界面，左侧为菜单/右侧为工作区（官方API：https://layui.dev/docs/2/）
- 其他组件中的图标，优先选用layui内置图标库（https://layui.dev/docs/2/icon/）

任务2.1:
发现问题：
运行程序后在后台首页发现下面报错：
Traceback (most recent call last):
  File "E:\Class01\day3\XHAgentOS\venv\Lib\site-packages\tornado\web.py", line 1878, in _execute
    result = method(*self.path_args, **self.path_kwargs)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\Class01\day3\XHAgentOS\venv\Lib\site-packages\tornado\web.py", line 3409, in wrapper
    return method(self, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\Class01\day3\XHAgentOS\app\controllers\home.py", line 9, in get
    username = self.current_user.decode("utf-8") if self.current_user else ""
               ^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: 'str' object has no attribute 'decode'
请改正问题

任务3；
继续完成后端-管理侧功能模块的开发。
-功能管理：将菜单功能化，实现动态管理所有功能模块
-角色管理：默认超级管理员角色和普通用户角色，允许新增/删除角色，超级管理员(admin)角色不能修改和删除。采用二级联动的方式实现。
-权限管理：功能与角色的映射关系，允许新增/删除/修改角色的权限。采用二级联动的方式实现。
开发限制：
-遵循前置任务开发成果及要求完成功能模块的实现，保证开发的一致性

任务4：
-模型引擎：
--实现以橱窗列表的页面风格。
--实现动态新增/删除/修改/查询模型引擎的功能。
--支持可视化配置满足OPENAI接口范式模型的 调用
--支持统计token(可视化)，支持分页一行三列，6条/页。页面风格需要以大模型科技感、炫酷风格为主要区别现有layui风格。
--支持对模型进行单独的对话测试功能。
--支持设置模式为默认模型，系统默认使用该模型。
--支持对模型进行批量操作，如删除、修改、启用/禁用等。
以下为模型代码示例：
from openai import OpenAI

client = OpenAI(api_key="API_KEY", base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "你好，请介绍一下你自己"}]
)
print(response.choices[0].message.content)
API_KEY = "sk-25369530ebd443cfa5cddfde5b819b2b"

任务4.1：
发现错误：
模型代码实例里面的client = OpenAI(api_key="API_KEY", base_url="https://api.deepseek.com")应该为client = OpenAI(api_key="API_KEY", base_url="https://api.deepseek.com/v1")
请修改正确

任务4.2：
发现错误：
现在将代码实例改为：
from openai import OpenAI
API_KEY = "sk-25369530ebd443cfa5cddfde5b819b2b"
client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.deepseek.com/v1"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "你好，请介绍一下你自己"}]
)
print(response.choices[0].message.content)

任务4.3：
发现错误：
现在将代码示例中的API_KEY = "sk-25369530ebd443cfa5cddfde5b819b2b"改为API_KEY="sk-600a1ad2a9f94e8d8a0b29c41803cb55"

任务4.4：
发现错误：
请将默认的模型引擎的接口地址改为https://api.deepseek.com/v1

任务4.5：
发现错误：默认引擎的接口地址错误，请将默认的模型引擎的接口地址改为https://api.deepseek.com/v1

任务4.6：
发现错误：默认引擎的接口地址错误，请将默认的模型引擎的接口地址改为https://api.deepseek.com/v1

任务4.7：
发现问题：在模型引擎模块中，点击删除，无法删除现有模型引擎，请改正这个问题

任务4.8：
发现错误：现在模型引擎模块的默认模型的密钥错误，请改为sk-25369530ebd443cfa5cddfde5b819b2b

任务4.9：
新添功能：在模型引擎模块，能查看每个模型一个月的token消耗趋势的曲线图

任务5：
继续完成后端-管理功能模块的开发。
-瞭望管理：这是一个通过大模型+ai实现的智能数据采集模块，支持新增瞭望数据源管理和采集功能，以下为具体要求：
--瞭望源管理：是一个动态可视化规则配置功能模块，支持新增/删除/修改/查询数据望源。以下为百度新闻数据源，你通过配置规则，实现管理功能。
‘’‘
1.采集入门url:
https://www.baidu.com/s?rtt=1&bsst=1&cl=undefined&tn=news&rsv_dl=ns_pc&word={西华大学}
https://www.baidu.com/s?rtt=1&bsst=1&cl=undefined&tn=news&rsv_dl=ns_pc&word={西华大学}&pn=10  pn为分页参数，每页10条数据
2.采集请求头Request Headers:
GET /s?rtt=1&bsst=1&cl=undefined&tn=news&rsv_dl=ns_pc&word=%E8%A5%BF%E5%8D%8E%E5%A4%A7%E5%AD%A6&x_bfe_rqs=03E80&x_bfe_tjscore=0.100000&tngroupname=organic_news&newVideo=12&goods_entry_switch=1&pn=10 HTTP/1.1
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6
Cache-Control: max-age=0
Connection: keep-alive
Cookie: BAIDUID_BFESS=6AB9D42852FE275BE77A658914772A87:FG=1; BAIDU_WISE_UID=wapp_1777645788218_428; BIDUPSID=6AB9D42852FE275BE77A658914772A87; PSTM=1780397895; BD_UPN=12314753; ZFY=pMua9c:BftIu:AN5:AlniAAHLk4v6nse3babMbHpzzjH:BE:C; __bid_n=19e8d405ed746085cf264b; BDUSS=YyRFNFVGJWcUx4SENJb2dQc0VGNEZMTC1xU2Rzb1lofmJxQVNRUWMxfnJuVWRxSVFBQUFBJCQAAAAAAQAAAAEAAADJKyEoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOsQIGrrECBqT3; BDUSS_BFESS=YyRFNFVGJWcUx4SENJb2dQc0VGNEZMTC1xU2Rzb1lofmJxQVNRUWMxfnJuVWRxSVFBQUFBJCQAAAAAAQAAAAEAAADJKyEoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOsQIGrrECBqT3; BDRCVFR[4Sa5I932hZT]=-_EV5wtlMr0mh-8uz4WUvY; H_PS_PSSID=63147_67721_67861_69001_69204_69295_69594_69765_69795_69780_69901_69961_70101_70159_70266_69921_70409_70434_70457_70479_70487_70522_70564_70612_70628_70785_70803_70815_70841_70549_70550_70501_70856_70909_70940; BA_HECTOR=2gal2haha48k20a40l84248la02k241l22ffi28; H_WISE_SIDS=63147_67721_67861_69001_69204_69295_69594_69765_69795_69780_69901_69961_70101_70159_70266_69921_70409_70434_70457_70479_70487_70522_70564_70612_70628_70785_70803_70815_70841_70549_70550_70501_70856_70909_70940; BDRCVFR[C0p6oIjvx-c]=mbxnW11j9Dfmh7GuZR8mvqV; delPer=0; BD_CK_SAM=1; PSINO=7; arialoadData=false; BDSVRTM=746
Host: www.baidu.com
Referer: https://www.baidu.com/s?rtt=1&bsst=1&cl=undefined&tn=news&rsv_dl=ns_pc&word=%E8%A5%BF%E5%8D%8E%E5%A4%A7%E5%AD%A6
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: same-origin
Sec-Fetch-User: ?1
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0
sec-ch-ua: "Chromium";v="148", "Microsoft Edge";v="148", "Not/A)Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
’‘’

根据以上采集源，需要开一套可动态接收参数的功能模块，以提供后续批量采集功能时调用。

-- 瞭望采集：开发一个类似搜索引擎的界面，输主框下方提供采集源的动态选对功能（开关样式），该界面要求独立风不与layui风格同步，炫酷，好看，用户交互体验简单，另外在采集源的选择面板下，提供参考配置：一次有效采集数目数（与URL中的参数同步），在参数面板的下方，实时呈现采集到的列表（橱窗列表模式，1行3列），列表支持多选/全据保存以数据库表中。

-- 数据仓库：采集到的数据保存到数据仓库对应表中。一页20条/页。

-- 数据查询：用户可以在数据仓库中查询采集到的数据，支持根据采集源、采集时间范围、采集状态等进行筛选。

-- 数据导出：用户可以将查询到的数据导出为Excel文件。

任务5.1：
发现问题:在采集到瞭望数据后，勾选其中几个数来后点击保存到数据仓库，但实则会把搜出的所有数据都保存到数据仓库中。请改这个BUG
