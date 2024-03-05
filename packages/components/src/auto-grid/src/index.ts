import type { PropType, VNode } from 'vue-demi';
import { computed, defineComponent, h, ref } from 'vue-demi';
import { isNumeric } from 'mixte';
import { useElementSize } from '@vueuse/core';
import { flatVNode } from '../../utils/flatVNode';

export const autoGridProps = {
  /**
   * 组件宽度 (单位: px)
   *  - 正常情况无需使用, 会自动获取组件宽度
   */
  width: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
  /** 子元素最小宽度 (单位: px) */
  itemWidth: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
  /** 横纵间距 (单位: px) */
  gap: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
  /** 横向间距 (单位: px) */
  gapX: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
  /** 纵向间距 (单位: px) */
  gapY: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
  /** 是否折叠 */
  collapsed: {
    type: Boolean,
  },
  /** 显示的行数 */
  collapsedRows: {
    type: [Number, String] as PropType<number | `${number}`>,
  },
} as const;

export default defineComponent({
  props: autoGridProps,
  setup(props, { slots }) {
    const rootRef = ref<HTMLElement>();
    const rootWidth = useElementSize(rootRef).width;

    const isCustomWidth = computed(() => isNumeric(props.width));
    const width = computed(() => isCustomWidth.value ? +props.width! : rootWidth.value);

    const itemWidth = computed(() => isNumeric(props.itemWidth) ? +props.itemWidth : width.value);
    const gap = computed(() => isNumeric(props.gap) ? +props.gap : 0);
    const gapX = computed(() => isNumeric(props.gapX) ? +props.gapX : gap.value);
    const gapY = computed(() => isNumeric(props.gapY) ? +props.gapY : gap.value);

    const collapsedRows = computed(() => isNumeric(props.collapsedRows) ? Math.max(1, +props.collapsedRows) : 1);

    const children = computed(() => {
      return flatVNode(slots.default?.());
    });

    const length = computed(() => {
      const gap = children.value.length > 1 ? gapX.value : 0;
      const length = Math.floor((width.value + gap) / (itemWidth.value + gap));

      if (length !== length) return 0; // eslint-disable-line no-self-compare
      return length;
    });

    return () => {
      let renderChildren = children.value;

      if (props.collapsed) {
        const hasSuffix = !!slots.overflowSuffix;
        const childrenLength = children.value.length;
        const rowsChildrenLength = collapsedRows.value * length.value;
        const count = childrenLength <= rowsChildrenLength ? childrenLength : (rowsChildrenLength - (hasSuffix ? 1 : 0));

        renderChildren = ([] as VNode[]).concat(
          children.value.slice(0, count),
          hasSuffix && childrenLength > rowsChildrenLength ? slots.overflowSuffix!() : [],
        );
      }

      return h(
        'div',
        {
          ref: rootRef,
          style: {
            width: isCustomWidth.value ? `${props.width}px` : '100%',
            display: 'grid',
            gridTemplateColumns: `repeat(${length.value}, 1fr)`,
            columnGap: `${gapX.value}px`,
            rowGap: `${gapY.value}px`,
          },
        },
        renderChildren.map((Node) => {
          return h('div', {
            style: { overflow: 'hidden' },
          }, [Node]);
        }),
      );
    };
  },
});
