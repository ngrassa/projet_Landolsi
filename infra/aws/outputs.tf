locals {
  public_ip = var.allocate_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "ami_id" {
  description = "AMI Ubuntu 24.04 utilisée"
  value       = aws_instance.app.ami
}

output "public_ip" {
  description = "IP publique (change après arrêt/démarrage sans IP élastique)"
  value       = local.public_ip
}

output "app_url" {
  value = "http://${local.public_ip}/"
}

output "ssh_command" {
  description = "AWS Academy : téléchargez labsuser.pem depuis 'AWS Details'"
  value       = "ssh -i ~/.ssh/labsuser.pem ubuntu@${local.public_ip}"
}

output "sslip_domain" {
  description = "Nom de domaine gratuit pointant vers l'IP publique (HTTPS : install.sh --domain)"
  value       = "landolsi-tires-${replace(local.public_ip, ".", "-")}.sslip.io"
}

output "https_setup_command" {
  description = "À lancer une fois cloud-init terminé pour activer HTTPS (Let's Encrypt)"
  value       = "ssh -i ~/.ssh/landolsi_ec2_ed25519 ubuntu@${local.public_ip} 'sudo /opt/landolsi-src/scripts/install.sh --domain landolsi-tires-${replace(local.public_ip, ".", "-")}.sslip.io'"
}
