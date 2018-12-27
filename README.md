# ngx-sortable

ngx-sortable是从[ngx-bootstrap](https://github.com/valor-software/ngx-bootstrap)中抽取出来的一个组件  

在 ngx-sortable 的文档中是这样写的
> The sortable component represents a list of items, with ability to sort them or move to another container via drag&drop. Input collection isn't mutated by the component, so events ngModelChange, onChange are using new collections.

这样对原数组进行操作，是无法修改视图的，所以我就将代码复制过来修改了一下，让它能够修改对象时也修改视图

![FRQzgU.gif](https://s1.ax1x.com/2018/12/27/FRQzgU.gif)

使用方法跟原来一致[(文档)](https://valor-software.com/ngx-bootstrap/#/sortable#usage)，并且添加了`dragStart`和`dragEnd`两个事件在拖拽开始和结束时触发，但是`dragEnd`会触发两次，原因没有深究


