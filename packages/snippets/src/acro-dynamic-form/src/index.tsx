import type { PropType } from 'vue';
import type { FieldRule } from '@arco-design/web-vue';
import { deepClone, isFunction, pascalCase } from 'mixte';
import { defineComponent, reactive } from 'vue';
import { Form, FormItem } from '@arco-design/web-vue';
import * as ArcoDesign from '@arco-design/web-vue';

export interface DynamicFormField {
  /** 字段类型 */
  type: 'input' | 'input-number' | 'textarea';
  /** 字段名 */
  field: string;
  /** 标签 */
  label?: string;
  /** 默认值 */
  defaultValue?: any;
  /** 传递给组件的参数 */
  componentProps?: Record<string, any>;
  /** 校验规则 */
  rules?: FieldRule | FieldRule[];
  /**
   * 触发校验的事件
   * @default ['change', 'blur']
   */
  validateTrigger?: 'change' | 'input' | 'focus' | 'blur' | ('change' | 'input' | 'focus' | 'blur')[];
};

export const acroDynamicFormProps = {
  /** 字段列表 */
  fields: Array as PropType<DynamicFormField[]>,
} as const;

export default defineComponent({
  props: acroDynamicFormProps,
  setup(props) {
    const form = reactive<Record<string, any>>({});

    props.fields?.forEach((field) => {
      const defaultValue = field.defaultValue;
      form[field.field] = deepClone(isFunction(defaultValue) ? defaultValue() : defaultValue);
    });

    return () => {
      return (
        <Form model={form}>
          {props.fields?.map((field) => {
            const Component = ArcoDesign[pascalCase(field.type)] as ReturnType<typeof defineComponent>;

            return (
              <FormItem
                field={field.field}
                label={field.label}
                rules={field.rules}
                validateTrigger={field.validateTrigger ?? ['change', 'blur']}
              >
                <Component v-model={form[field.field]} {...field.componentProps} />
              </FormItem>
            );
          })}
        </Form>
      );
    };
  },
});
