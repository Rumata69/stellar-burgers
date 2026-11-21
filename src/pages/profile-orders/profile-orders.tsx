import { Preloader } from '@ui';
import { ProfileOrdersUI } from '@ui-pages';
import { useEffect } from 'react';

import { selectOrders } from '@services/selectors';
import { loadHistory, ORDERS_REFRESH_INTERVAL } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

export const ProfileOrders = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { history, historyLoading, historyError } = useSelector(selectOrders);

  useEffect(() => {
    void dispatch(loadHistory());

    const timer = window.setInterval(() => {
      void dispatch(loadHistory());
    }, ORDERS_REFRESH_INTERVAL);

    return (): void => window.clearInterval(timer);
  }, [dispatch]);

  if (historyLoading && !history.length) return <Preloader />;

  return (
    <>
      {historyError && <p role="alert">{historyError}</p>}
      <ProfileOrdersUI orders={history} />
    </>
  );
};
