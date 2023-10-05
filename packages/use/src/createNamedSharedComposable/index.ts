import type { AsyncReturnType } from 'type-fest';
import type { EffectScope } from 'vue-demi';
import { effectScope } from 'vue-demi';
import { tryOnScopeDispose } from '@vueuse/core';

/**
 * 可命名的共享函数/组合式函数
 *   - 对传入的函数进行包装, 返回一个新的函数
 *     - 调用该函数并传入命名及参数, 会将参数传入原函数并执行, 并将结果返回
 *     - 再次调用时, 如果是相同的命名, 则会直接返回上次的结果, 不会再次执行原函数
 *   - 在 Vue 实例 / effect 作用域中使用时
 *     - 当引用该函数的所有 Vue 实例 / effect 作用域销毁时, 会自动清除缓存
 * @param composable 要共享的函数/组合式函数
 * @returns 包装后的新函数
 * @example
 * import { createNamedSharedComposable } from '@mixte/use';
 *
 * function getUserInfo(tenantId: string, id: string) {
 *   return axios.get(`/api/${tenantId}/user/${id}`);
 * }
 *
 * const getSharedUserInfo = createNamedSharedComposable(getUserInfo);
 *
 * // CompA.vue
 * //  - 在这里, 前面的参数是命名, 后面的参数会全部传递给 getUserInfo 方法
 * console.log(await getSharedUserInfo('xxx/1', 'xxx', '1'));
 *
 * // CompB.vue
 * //  - 复用第一次调用时的结果
 * console.log(await getSharedUserInfo('xxx/1', 'xxx', '1'));
 */
export function createNamedSharedComposable<Fn extends (...args: any[]) => any>(composable: Fn) {
  const cache: Record<string, {
    subscribers: number
    state?: ReturnType<Fn>
    scope?: EffectScope
  }> = {};

  return function (name: string, ...args: Parameters<Fn>): AsyncReturnType<Fn> {
    const result = cache[name] || (cache[name] = {
      subscribers: 0,
      state: undefined,
      scope: undefined,
    });

    result.subscribers++;

    if (!result.scope)
      result.state = (result.scope = effectScope()).run(() => composable(...args));

    tryOnScopeDispose(() => {
      result.subscribers--;
      if (result.scope && result.subscribers <= 0) {
        result.scope.stop();
        delete cache[name];
      }
    });

    return result.state!;
  };
}
