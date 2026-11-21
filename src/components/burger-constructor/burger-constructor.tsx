import { BurgerConstructorUI } from '@ui';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectConstructor, selectOrders, selectUser } from '@services/selectors';
import { closeOrder, createOrder } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

export const BurgerConstructor = (): React.JSX.Element => {
  const constructorItems = useSelector(selectConstructor);
  const { creating, created, createError } = useSelector(selectOrders);
  const { user } = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const onOrderClick = (): void => {
    if (!user) {
      void navigate('/login', { state: { from: location } });
      return;
    }

    if (!constructorItems.bun || creating) return;

    const bunId = constructorItems.bun._id;

    void dispatch(
      createOrder([
        bunId,
        ...constructorItems.ingredients.map((item) => item._id),
        bunId,
      ])
    );
  };

  const price =
    (constructorItems.bun?.price ?? 0) * 2 +
    constructorItems.ingredients.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <BurgerConstructorUI
        price={price}
        constructorItems={constructorItems}
        orderRequest={creating}
        orderModalData={created}
        onOrderClick={onOrderClick}
        closeOrderModal={() => {
          dispatch(closeOrder());
        }}
      />
      {createError && <p role="alert">{createError}</p>}
    </>
  );
};
