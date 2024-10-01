import type { ReactNode } from 'react';
import { useRouteMatch } from 'react-router-dom';
import Constraints from '@commercetools-uikit/constraints';
import Grid from '@commercetools-uikit/grid';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Link from '@commercetools-uikit/link';

type TWrapWithProps = {
  children: ReactNode;
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
};
const WrapWith = (props: TWrapWithProps) => (
  <>{props.condition ? props.wrapper(props.children) : props.children}</>
);
WrapWith.displayName = 'WrapWith';

const Welcome = () => {
  const match = useRouteMatch();

  return (
    <Constraints.Horizontal max={16}>
      <Grid
        gridGap="16px"
        gridAutoRows='1fr'
        gridTemplateRows="1fr 3fr 2fr"
      >
        <Grid.Item alignSelf='stretch'>
          <Text.Headline as="h1" intlMessage={messages.title}/>
        </Grid.Item>

        <Grid.Item alignSelf='center'>
          <Text.Body intlMessage={messages.info}/>
        </Grid.Item>

        <Grid.Item alignSelf='center'>
          <Text.Body intlMessage={messages.documentation}/>
          <Link isExternal={true} to={messages.documentationLink.defaultMessage}>GitHub Documentation</Link>
        </Grid.Item>

        <Grid.Item alignSelf='center'>
          <Link isExternal={true} to={messages.supportLink.defaultMessage} intlMessage={messages.support}/>
        </Grid.Item>

        <Grid.Item alignSelf='center'>
          <Text.Body intlMessage={messages.avalara}/>
          <Link isExternal={true} to={messages.avalaraHelpLink.defaultMessage} intlMessage={messages.avalaraHelp}/>
        </Grid.Item>

        <Grid.Item alignSelf='center'>
          <SecondaryButton
            as={Link}
            isExternal={false}
            to={`${match.url}/settings`}
            label={'Procceed to Connector Settings'}
          />
        </Grid.Item>
      </Grid>
    </Constraints.Horizontal>
  );
};
Welcome.displayName = 'Welcome';

export default Welcome;
