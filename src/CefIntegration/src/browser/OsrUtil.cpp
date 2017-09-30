#include "OsrUtil.h"
#include "include/internal/cef_types_wrappers.h"
#include "pugixml.hpp"
#include "Utils/FileUtil.h"

namespace cefIntegration {

int OsrUtil::GetCefMouseModifiers(WPARAM wparam) {
	int modifiers = 0;
	if (wparam & MK_CONTROL)
		modifiers |= EVENTFLAG_CONTROL_DOWN;
	if (wparam & MK_SHIFT)
		modifiers |= EVENTFLAG_SHIFT_DOWN;
	if (IsKeyDown(VK_MENU))
		modifiers |= EVENTFLAG_ALT_DOWN;
	if (wparam & MK_LBUTTON)
		modifiers |= EVENTFLAG_LEFT_MOUSE_BUTTON;
	if (wparam & MK_MBUTTON)
		modifiers |= EVENTFLAG_MIDDLE_MOUSE_BUTTON;
	if (wparam & MK_RBUTTON)
		modifiers |= EVENTFLAG_RIGHT_MOUSE_BUTTON;

	// Low bit set from GetKeyState indicates "toggled".
	if (::GetKeyState(VK_NUMLOCK) & 1)
		modifiers |= EVENTFLAG_NUM_LOCK_ON;
	if (::GetKeyState(VK_CAPITAL) & 1)
		modifiers |= EVENTFLAG_CAPS_LOCK_ON;
	return modifiers;
}

bool OsrUtil::IsKeyDown(WPARAM wparam) {
	return (GetKeyState(wparam) & 0x8000) != 0;
}


int OsrUtil::GetCefKeyboardModifiers(WPARAM wparam, LPARAM lparam) {
	int modifiers = 0;
	if (IsKeyDown(VK_SHIFT))
		modifiers |= EVENTFLAG_SHIFT_DOWN;
	if (IsKeyDown(VK_CONTROL))
		modifiers |= EVENTFLAG_CONTROL_DOWN;
	if (IsKeyDown(VK_MENU))
		modifiers |= EVENTFLAG_ALT_DOWN;

	// Low bit set from GetKeyState indicates "toggled".
	if (::GetKeyState(VK_NUMLOCK) & 1)
		modifiers |= EVENTFLAG_NUM_LOCK_ON;
	if (::GetKeyState(VK_CAPITAL) & 1)
		modifiers |= EVENTFLAG_CAPS_LOCK_ON;

	switch (wparam) {
	case VK_RETURN:
		if ((lparam >> 16) & KF_EXTENDED)
			modifiers |= EVENTFLAG_IS_KEY_PAD;
		break;
	case VK_INSERT:
	case VK_DELETE:
	case VK_HOME:
	case VK_END:
	case VK_PRIOR:
	case VK_NEXT:
	case VK_UP:
	case VK_DOWN:
	case VK_LEFT:
	case VK_RIGHT:
		if (!((lparam >> 16) & KF_EXTENDED))
			modifiers |= EVENTFLAG_IS_KEY_PAD;
		break;
	case VK_NUMLOCK:
	case VK_NUMPAD0:
	case VK_NUMPAD1:
	case VK_NUMPAD2:
	case VK_NUMPAD3:
	case VK_NUMPAD4:
	case VK_NUMPAD5:
	case VK_NUMPAD6:
	case VK_NUMPAD7:
	case VK_NUMPAD8:
	case VK_NUMPAD9:
	case VK_DIVIDE:
	case VK_MULTIPLY:
	case VK_SUBTRACT:
	case VK_ADD:
	case VK_DECIMAL:
	case VK_CLEAR:
		modifiers |= EVENTFLAG_IS_KEY_PAD;
		break;
	case VK_SHIFT:
		if (IsKeyDown(VK_LSHIFT))
			modifiers |= EVENTFLAG_IS_LEFT;
		else if (IsKeyDown(VK_RSHIFT))
			modifiers |= EVENTFLAG_IS_RIGHT;
		break;
	case VK_CONTROL:
		if (IsKeyDown(VK_LCONTROL))
			modifiers |= EVENTFLAG_IS_LEFT;
		else if (IsKeyDown(VK_RCONTROL))
			modifiers |= EVENTFLAG_IS_RIGHT;
		break;
	case VK_MENU:
		if (IsKeyDown(VK_LMENU))
			modifiers |= EVENTFLAG_IS_LEFT;
		else if (IsKeyDown(VK_RMENU))
			modifiers |= EVENTFLAG_IS_RIGHT;
		break;
	case VK_LWIN:
		modifiers |= EVENTFLAG_IS_LEFT;
		break;
	case VK_RWIN:
		modifiers |= EVENTFLAG_IS_RIGHT;
		break;
	}
	return modifiers;
}


float OsrUtil::GetDeviceScaleFactor() {
	static float scale_factor = 1.0;
	static bool initialized = false;

	if (!initialized) {
		// This value is safe to cache for the life time of the app since the user
		// must logout to change the DPI setting. This value also applies to all
		// screens.
		HDC screen_dc = ::GetDC(NULL);
		int dpi_x = GetDeviceCaps(screen_dc, LOGPIXELSX);
		float temp_scale_factor = static_cast<float>(dpi_x) / 96.0f;
		::ReleaseDC(NULL, screen_dc);
		
		int MainWndHeight = 0;
		pugi::xml_document doc;
		pugi::xml_parse_result result = doc.load_file(std::string(FileUtil::ProcessPath() + "\\config\\bee.config").c_str());
		if (result.status == pugi::status_ok) {
			pugi::xml_node node = doc.first_element_by_path("/configuration/cef/mainWndHeight");
			if (!node.empty()) {
				MainWndHeight = atoi(node.child_value());
			}
		}

		int screenHeight = ::GetSystemMetrics(SM_CYSCREEN);
		while (screenHeight < temp_scale_factor * MainWndHeight && temp_scale_factor > 1.0) {
			temp_scale_factor -= 0.25;
		}

		float optimation_rate = (screenHeight >= 1080) ? 0.9 : 0.8;
		if (screenHeight * optimation_rate < temp_scale_factor * MainWndHeight) {
			temp_scale_factor -= 0.25;
		}

		if (temp_scale_factor < 1.0) {
			temp_scale_factor = 1.0;
		}

		scale_factor = temp_scale_factor;
		initialized = true;
	}

	return scale_factor;
}

}