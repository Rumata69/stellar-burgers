import { Preloader, OrderInfoUI } from '@ui';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { selectIngredients, selectOrders } from '@services/selectors';
import { loadOrder } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { TIngredient } from '@utils-types';

export const OrderInfo = (): React.JSX.Element => {
  const { number } = useParams();
  const dispatch = useDispatch();
  const { current, detailsLoading, detailsError } = useSelector(selectOrders);
  const { items: ingredients } = useSelector(selectIngredients);
  const orderNumber = Number(number);
  const orderData = current?.number === orderNumber ? current : null;

  useEffect(() => {
    if (Number.isInteger(orderNumber) && orderNumber > 0)
      void dispatch(loadOrder(orderNumber));
  }, [dispatch, orderNumber]);

  const orderInfo = useMemo(() => {
    if (!orderData || !ingredients.length) return null;

    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = Record<string, TIngredient & { count: number }>;

    const ingredientsInfo = orderData.ingredients.reduce(
      (acc: TIngredientsWithCount, item) => {
        if (!acc[item]) {
          const ingredient = ingredients.find((ing) => ing._id === item);

          if (ingredient) {
            acc[item] = {
              ...ingredient,
              count: 1,
            };
          }
        } else {
          acc[item].count++;
        }

        return acc;
      },
      {}
    );

    const total = Object.values(ingredientsInfo).reduce(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...orderData,
      ingredientsInfo,
      date,
      total,
    };
  }, [orderData, ingredients]);

  if (!Number.isInteger(orderNumber) || orderNumber <= 0)
    return <p>Некорректный номер заказа</p>;

  if (detailsError) return <p role="alert">{detailsError}</p>;

  if (detailsLoading || !orderInfo) return <Preloader />;

  return (
    <>
      <p className="text text_type_digits-default">#{orderInfo.number}</p>
      <OrderInfoUI orderInfo={orderInfo} />
    </>
  );
};
