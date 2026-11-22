import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';
import { useEffect } from 'react';

import { selectOrders } from '@services/selectors';
import { loadFeed, ORDERS_REFRESH_INTERVAL } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

export const Feed = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { feed } = useSelector(selectOrders);

  const handleGetFeeds = (): void => {
    void dispatch(loadFeed());
  };

  useEffect(() => {
    void dispatch(loadFeed());

    const timer = window.setInterval(() => {
      void dispatch(loadFeed());
    }, ORDERS_REFRESH_INTERVAL);

    return (): void => window.clearInterval(timer);
  }, [dispatch]);

  if (feed.isLoading && !feed.orders.length) return <Preloader />;

  return (
    <>
      {!!feed.error && (
        <p role="alert">
          {typeof feed.error === 'string' ? feed.error : 'Не удалось загрузить ленту'}
        </p>
      )}
      <FeedUI orders={feed.orders} handleGetFeeds={handleGetFeeds} />
    </>
  );
};
