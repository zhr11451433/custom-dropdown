/* ============================================================
   自定义下拉菜单 — 逻辑
   核心原则：JS 不直接改样式，只做两件事 ——
     ① 改状态变量   ② 在容器上切 class
   显示 / 隐藏 / 箭头旋转，全部由 CSS 响应 class 来完成。
   ============================================================ */

// ---------- 1. 抓取页面元素 ----------
// 一次抓完，存在变量里；不要每次用到时再 querySelector 一遍
const box     = document.querySelector('.box');
const trigger = document.querySelector('.select_item');
const list    = document.querySelector('.item_box');

// ---------- 2. 状态：两个正交变量 ----------
// 注意这里只有"是否展开"，没有"是否选中"。
// 因为"打开"和"已选"是两件互不相干的事，可以同时成立：
// 选中 Item 3 之后再展开列表 → 既是打开态、也是已选态。
// 如果写成 state = 'default' | 'open' | 'selected' 三选一的枚举，
// 这种情况就表达不出来了。
let isOpen = false;
let selectedValue = null
// 先把占位文本存一份，恢复初始状态时要用
const PLACEHOLDER = trigger.querySelector('.select_text').textContent
// ---------- 3. 渲染：把状态翻译成界面 ----------
// 界面永远是状态的"计算结果"。所有视觉变化都从这里统一输出，
// 所以不会出现"某个地方忘了同步"的脏状态。
function render() {
    // classList 是 DOM 元素身上的一个类名集合
    // toggle(类名, 布尔值)：
    //   第二个参数为 true  → 加上这个类
    //   第二个参数为 false → 去掉这个类
    //   不传第二个参数时   → 有就删、没有就加（纯切换）
    // 用"传布尔值"的写法，比写 if/else 两个分支干净得多。
    box.classList.toggle('is-open', isOpen)
    // b) 触发器文字：有选中就显示选中值，没选中就显示占位文本
    const textEl = trigger.querySelector('.select_text')
    if (selectedValue !== null) {
        textEl.textContent = selectedValue
    }else{
        textEl.textContent = PLACEHOLDER
    }
    // c) 遍历所有 li，给选中的那个加 is-selected，其余移除
    //    注意：这里要每次重新查 li，因为 DOM 可能被替换（虽然现在没有，但习惯要好）
    const items = list.querySelectorAll('li')
    items.forEach(item => {
        // 用 dataset.value 取值，而不是 textContent
        // 因为 textContent 会把后面的 ✓ 也一起读进来
        const isThisSelected = item.dataset.value===selectedValue
        item.classList.toggle('is-selected', isThisSelected)
    })
}

// ---------- 4. 事件：点触发器 → 开合 ----------
trigger.addEventListener('click', () => {
    isOpen = !isOpen;   // 先改状态
    render();           // 再让界面跟上
});
// ---------- 5. 事件：点选项 → 选中 + 关闭 ----------
// 事件委托：只在 ul 上绑一次，不要给每个 li 各绑一个
list.addEventListener('click', (e) => {
    // e.target 可能点到了 .option_text 或 .check（span 上）
    // closest('li') 能从被点的元素往上找，找到最近的 li
    const li =e.target.closest('li')
    // 点在 ul 空白处，忽略
    if (!li){
        return
    }
    // 【取出选项的值】就这一句，关键！
    selectedValue = li.dataset.value
    isOpen = false
    render()
})
// ---------- 6. 首次渲染 ----------
// 不能省。否则页面初始的样子是"HTML 里写死的"，而不是"状态算出来的"，
// 两边一旦不一致，后面就会出现奇怪的 bug。
render();


/* ============================================================
   TODO（下一步，留给你自己写）

   阶段 3：点选项 → 选中 + 关闭 + 回填 + 高亮
   ------------------------------------------------------------
   需要新增一个状态变量，例如   let selectedValue = null;

   然后在 render() 里补两件事：
     a) 触发器文字 = selectedValue 有值 ? 那个值 : 占位文本
        （占位文本可以在初始化时先存一份，例如
          const PLACEHOLDER = trigger.querySelector('.select_text').textContent; ）
     b) 遍历 list 里的所有 li：
          文本（或 data-value）等于 selectedValue 的那个 → 加 is-selected 类
          其余的 → 全部移除 is-selected 类
        ⚠️ 这一步是"只有一个勾"的关键。如果点击时直接 add 而不清理别人，
           点两次不同选项就会同时出现两个勾。

   然后加一个点击事件（事件委托：只在 list 上绑一次，不要给每个 li 各绑一个）：
     list.addEventListener('click', (e) => {
         const li = e.target.closest('li');   // 点在勾上也能找回整行
         if (!li) return;                     // 点在 ul 的空白处，忽略
         selectedValue = li.dataset.value;    // 用 data-value，不要用 textContent
         isOpen = false;                      // 选中后关闭
         render();
     });

   写完自己先测：点 Item 3 → 触发器变成 Item 3、列表关闭；
   再展开 → Item 3 那行右边出现黑底白勾，且只有它一个勾；
   再点 Item 5 → 勾要"搬家"到 Item 5，Item 3 的勾消失。
   ============================================================ */
// 阶段 4（再下一步）：点击组件外部关闭。
//      思路：在 document 上监听点击，判断"被点击的元素是否在 .box 里面"，
//      不在就关闭。⚠️ 千万不要用 blur / 失焦来做这件事 ——
//      点击选项的瞬间 焦点会先丢失，列表会抢在你点到之前关掉。
document.addEventListener('click', (e) => {
    //页面展开
    // const li = e.target.closest('li')
    // if (!li){
    //     isOpen=false
    //     render()
    // }
    // ① 守卫：本来就没展开，什么都不用做（提前返回，别做无用的 DOM 操作）
    if(!isOpen){
        return
    }
    // ② 点在组件【内部】：触发了别的事（比如点触发器开合、点选项选中），
    //    这些都已经由各自的监听器处理完了，这里不要插手
    //判断那个节点是不是自己的后代（或者就是自己）
    if(box.contains(e.target)){
        return
    }
    // ③ 剩下的情况 = 点了组件外面 → 关闭
    isOpen=false
    render()
})