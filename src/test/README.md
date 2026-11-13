# 公共追踪页前端测试

运行 `npm test`（一次运行）或 `npm run test:watch`（监听）。测试使用 Vitest、jsdom 和 React Testing Library，涵盖个人关注和共享关注入口。

测试文件：
- `trackingTime.test.ts`：小数秒解析、毫秒精度、赛事时区和跨午夜。
- `utils.test.ts`：组别状态顺序、开赛/关门边界、时区和备用日期字段。
- `runnerOrdering.test.ts`：实际进度、终点、同点到达时间、预测点、跨午夜、毫秒打卡、分段用时不参与到达时间计算、筛选和不可变输入。
- `components/useTrackingViewMode.test.tsx`：默认列表、保存的卡片偏好、持久化、存储不可用。
- `components/TrackingGroups.test.tsx`：独立筛选、键盘/清空不折叠、空结果、折叠持久化、视图切换、历史和移除。
- `components/RunnerSearchModal.test.tsx`：添加选手查询、分组、多候选、确认、失败及重开重置。
- `TrackingPages.test.tsx`：两个真实页面入口的排序、筛选、切换、刷新以及添加入口回归。

全部使用本地合成数据；请求模块被 mock，测试 setup 同时阻止 fetch 和 XMLHttpRequest 实际发送。无需后端，不访问线上 API 或计时服务。

## 行为与边界

- 组别顺序为进行中、即将开始、已结束、时间待定。同状态按开赛时间、ID 排序。
- 带 UTC/偏移的时间按绝对时间处理；无偏移日期按赛事时区解析。主字段不可用时回退到 Local、Beijing 字段。缺少关门时间时，已开赛组保持进行中，不能凭关注的部分选手状态推断整组结束。
- 首次默认列表，只有明确保存 `cards` 才默认卡片。存储不可用仍可在当前会话切换。
- 组内搜索仅匹配当前组的正式姓名、昵称和号码；忽略大小写与首尾空白。筛选词在数据刷新和模式切换时保留，但不写入 localStorage。
- 两种展示模式共享排序后的数据。只有可解析的实际 `time` 算进度，只有预测的点和 `nextCheckpoint` 不算。
- 终点实际打卡或 finished 状态排最前。只有 finished 状态、没有终点实际时间的选手排在有终点时间的完赛选手之后；不会拿最后一个中间点的时间冒充完赛时间。
- DNS/DNF 排在其他选手之后。相同进度和时间用选手 ID 稳定排序。
- 时间只有 `HH:mm[:ss[.SSS]]` 时，以开赛时间为锚点推断首次可能到达日，并保留毫秒精度。`cumulativeTime` 可能是分段用时，不参与到达时刻计算。没有开赛时间时用已有带日期打卡的日期，否则比较时钟值。仅有时钟且没有日期，无法可靠识别多天后的同一时刻。

## 验证命令

```sh
npm test
npx tsc -b --pretty false
npm run build
npm run lint
```

本次改动前全仓 lint 已有 37 个错误和 1 个警告，分布于其他 callback、EventDashboard、Store、UserCenter 等文件。可单独检查本次涉及范围：

```sh
npx eslint src/pages/PublicEventTracking src/test vitest.config.ts
```
