import { fireEvent, render } from '@testing-library/react-native';

import Button from '../Button';

describe('<Button />', () => {
    it('renders its label', async () => {
        const { getByText } = await render(<Button onPress={jest.fn()}>Save recipe</Button>);

        expect(getByText('Save recipe')).toBeVisible();
    });

    it('calls onPress when pressed', async () => {
        const onPress = jest.fn();

        const { getByText } = await render(<Button onPress={onPress}>Save recipe</Button>);
        fireEvent.press(getByText('Save recipe'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', async () => {
        const onPress = jest.fn();

        const { getByText } = await render(
            <Button disabled onPress={onPress}>
                Save recipe
            </Button>
        );
        fireEvent.press(getByText('Save recipe'));

        expect(onPress).not.toHaveBeenCalled();
    });
});
