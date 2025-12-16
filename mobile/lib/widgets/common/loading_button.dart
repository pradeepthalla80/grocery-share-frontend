import 'package:flutter/material.dart';

import '../../config/theme.dart';

class LoadingButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final String label;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final IconData? icon;

  const LoadingButton({
    super.key,
    required this.onPressed,
    required this.isLoading,
    required this.label,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width ?? double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? AppColors.primary,
          foregroundColor: textColor ?? Colors.white,
          disabledBackgroundColor: (backgroundColor ?? AppColors.primary).withOpacity(0.6),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : icon != null
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon, size: 20),
                      const SizedBox(width: 8),
                      Text(label),
                    ],
                  )
                : Text(label),
      ),
    );
  }
}

class LoadingIconButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final IconData icon;
  final Color? color;
  final double size;

  const LoadingIconButton({
    super.key,
    required this.onPressed,
    required this.isLoading,
    required this.icon,
    this.color,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: isLoading ? null : onPressed,
      icon: isLoading
          ? SizedBox(
              height: size,
              width: size,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  color ?? AppColors.primary,
                ),
              ),
            )
          : Icon(icon, color: color, size: size),
    );
  }
}
