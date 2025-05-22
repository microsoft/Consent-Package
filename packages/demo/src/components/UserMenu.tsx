import { useNavigate } from "react-router";
import {
  makeStyles,
  shorthands,
  Persona,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
} from "@fluentui/react-components";
import type { ProfileData } from "@open-source-consent/ui";

interface UserMenuProps {
  user: ProfileData;
  onLogout(): void;
  onCloseMobileMenu?(): void;
}

const useStyles = makeStyles({
  userDisplay: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
});

export function UserMenu({
  user,
  onLogout,
  onCloseMobileMenu,
}: UserMenuProps): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onCloseMobileMenu?.();
    void navigate(path);
  };

  const handleLogout = () => {
    onCloseMobileMenu?.();
    onLogout();
  };

  return (
    <div className={styles.userDisplay}>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Persona
            name={user.name}
            secondaryText={user.email}
            avatar={{ color: "colorful" }}
            presence={{ status: "available" }}
          />
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => handleNavigate(`/profile/${user.id}`)}>
              View Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
}
