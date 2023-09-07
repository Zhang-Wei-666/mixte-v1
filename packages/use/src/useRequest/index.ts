import { createEventHook, toReactive, toValue } from '@vueuse/core';
import { computed, ref, shallowRef } from 'vue-demi';
import type { MaybeRefOrGetter } from 'vue-demi';

// TODO
//  1. 优化方法类型定义
//  2. execute 方法返回 response
//  3. execute 方法支持传参, 参数传递给 userExecute
//  4. execute 方法类型定义需继承 userExecute
//  5. data 支持 shallowRef
//  6. 完善单元测试, 确保在各个请求钩子触发时, 对应的状态已更新 ( 防止以后维护时影响到 )

export interface UseRequestOptions<T = undefined> {
  /**
   * 初始数据
   * @default undefined
   */
  initialData?: MaybeRefOrGetter<T>
  /**
   * 是否立即发起请求
   * @default false
   */
  immediate?: boolean
  /**
   * 是否在发起请求时重置数据
   * @default true
   */
  resetOnExecute?: boolean
}

/**
 *
 */
export function useRequest(userExecute: () => Promise<any>, options: UseRequestOptions<number> = {}) {
  const {
    initialData,
    immediate = false,
    resetOnExecute = true,
  } = options;

  /** 请求成功事件钩子 */
  const successEvent = createEventHook();
  /** 请求失败事件钩子 */
  const errorEvent = createEventHook();
  /** 请求完成事件钩子 */
  const finallyEvent = createEventHook<null>();

  /** 服务器响应 */
  const response = shallowRef();
  /** 服务器响应数据 */
  const data = ref(toValue(initialData));
  /** 服务器返回的错误 */
  const error = shallowRef<any>();
  /** 是否发起过请求 */
  const isExecuted = ref(false);
  /** 是否在请求中 */
  const isLoading = ref(false);
  /** 是否已请求完成 */
  const isFinished = ref(false);
  /** 是否已请求成功 */
  const isSuccess = ref(false);

  /** 发起请求 */
  async function execute() {
    // 标记发起过请求
    isExecuted.value = true;
    // 标记请求中
    isLoading.value = true;
    // 重置状态
    isFinished.value = false;
    isSuccess.value = false;
    // 重置变量
    if (resetOnExecute) {
      response.value = undefined;
      data.value = toValue(initialData);
      error.value = undefined;
    }

    try {
      const res = await userExecute();
      const resData = res?.data;

      response.value = res;
      data.value = resData;

      isLoading.value = false;
      isFinished.value = true;
      isSuccess.value = true;
      successEvent.trigger(res);
      finallyEvent.trigger(null);
    }
    catch (e) {
      isLoading.value = false;
      isFinished.value = true;
      error.value = e;
      errorEvent.trigger(e);
      finallyEvent.trigger(null);
      throw e;
    }
  }

  // 立即发起请求
  immediate && execute();

  return toReactive(
    computed(() => ({
      /** 服务器响应 */
      response,
      /** 服务器响应数据 */
      data,
      /** 服务器返回的错误 */
      error,

      /** 是否发起过请求 */
      isExecuted,
      /** 是否在请求中 */
      isLoading,
      /** 是否已请求完成 */
      isFinished,
      /** 是否已请求成功 */
      isSuccess,

      execute,

      /** 请求成功事件钩子 */
      onSuccess: successEvent.on,
      /** 请求失败事件钩子 */
      onError: errorEvent.on,
      /** 请求完成事件钩子 */
      onFinally: finallyEvent.on,
    })),
  );
}
